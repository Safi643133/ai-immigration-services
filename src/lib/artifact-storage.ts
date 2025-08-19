import { createClient } from '@supabase/supabase-js'
import { writeFile, mkdir, readFile, unlink } from 'fs/promises'
import { join, dirname } from 'path'
import { existsSync } from 'fs'

/**
 * Artifact Storage System
 * 
 * Handles storing and retrieving artifacts from CEAC automation jobs.
 * Supports both local file storage and Supabase Storage.
 */

export type ArtifactType = 'screenshot' | 'html' | 'har' | 'video' | 'log' | 'pdf'

export interface ArtifactMetadata {
  jobId: string
  type: ArtifactType
  filename: string
  mimeType: string
  size: number
  checksum?: string
  metadata?: Record<string, any>
}

export interface StoredArtifact extends ArtifactMetadata {
  id: string
  storagePath: string
  publicUrl?: string
  createdAt: string
}

export class ArtifactStorage {
  private supabase
  private localStoragePath: string
  private useSupabaseStorage: boolean

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    this.localStoragePath = process.env.ARTIFACT_STORAGE_PATH || './artifacts'
    this.useSupabaseStorage = process.env.USE_SUPABASE_STORAGE === 'true'
  }

  /**
   * Store an artifact
   */
  async storeArtifact(
    data: Buffer | string,
    metadata: ArtifactMetadata
  ): Promise<StoredArtifact> {
    try {
      let storagePath: string
      let publicUrl: string | undefined

      if (this.useSupabaseStorage) {
        // Store in Supabase Storage
        const storageResult = await this.storeInSupabase(data, metadata)
        storagePath = storageResult.path
        publicUrl = storageResult.publicUrl
      } else {
        // Store locally
        storagePath = await this.storeLocally(data, metadata)
      }

      // Create database record - handle missing columns gracefully
      const insertData: any = {
        job_id: metadata.jobId,
        filename: metadata.filename,
        storage_path: storagePath,
        mime_type: metadata.mimeType,
        file_size: metadata.size
      }
      
      // Add optional columns if they exist
      try {
        insertData.type = metadata.type
      } catch (e) {
        console.log('Type column not available, skipping...')
      }
      
      try {
        insertData.public_url = publicUrl
      } catch (e) {
        console.log('Public URL column not available, skipping...')
      }
      
      try {
        insertData.checksum = metadata.checksum
      } catch (e) {
        console.log('Checksum column not available, skipping...')
      }
      
      try {
        insertData.metadata = metadata.metadata || {}
      } catch (e) {
        console.log('Metadata column not available, skipping...')
      }

      const { data: artifact, error } = await this.supabase
        .from('ceac_artifacts')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        // If it's a schema error, try without metadata
        if (error.message.includes('metadata') && error.message.includes('column')) {
          console.log('Retrying without metadata column...')
          delete insertData.metadata
          
          const { data: artifact2, error: error2 } = await this.supabase
            .from('ceac_artifacts')
            .insert(insertData)
            .select()
            .single()
            
          if (error2) {
            throw new Error(`Failed to create artifact record: ${error2.message}`)
          }
          
          return {
            id: artifact2.id,
            jobId: artifact2.job_id,
            type: artifact2.type as ArtifactType,
            filename: artifact2.filename,
            storagePath: artifact2.storage_path,
            publicUrl: artifact2.public_url,
            mimeType: artifact2.mime_type,
            size: artifact2.file_size,
            checksum: artifact2.checksum,
            metadata: {},
            createdAt: artifact2.created_at
          }
        } else {
          throw new Error(`Failed to create artifact record: ${error.message}`)
        }
      }

      return {
        id: artifact.id,
        jobId: artifact.job_id,
        type: artifact.type as ArtifactType,
        filename: artifact.filename,
        storagePath: artifact.storage_path,
        publicUrl: artifact.public_url,
        mimeType: artifact.mime_type,
        size: artifact.file_size,
        checksum: artifact.checksum,
        metadata: artifact.metadata,
        createdAt: artifact.created_at
      }
    } catch (error) {
      console.error('Failed to store artifact:', error)
      throw error
    }
  }

  /**
   * Retrieve an artifact
   */
  async getArtifact(artifactId: string): Promise<StoredArtifact | null> {
    try {
      const { data: artifact, error } = await this.supabase
        .from('ceac_artifacts')
        .select('*')
        .eq('id', artifactId)
        .single()

      if (error || !artifact) {
        return null
      }

      return {
        id: artifact.id,
        jobId: artifact.job_id,
        type: artifact.type as ArtifactType,
        filename: artifact.filename,
        storagePath: artifact.storage_path,
        publicUrl: artifact.public_url,
        mimeType: artifact.mime_type,
        size: artifact.file_size,
        checksum: artifact.checksum,
        metadata: artifact.metadata,
        createdAt: artifact.created_at
      }
    } catch (error) {
      console.error('Failed to get artifact:', error)
      return null
    }
  }

  /**
   * Get artifacts for a job
   */
  async getJobArtifacts(jobId: string, type?: ArtifactType): Promise<StoredArtifact[]> {
    try {
      let query = this.supabase
        .from('ceac_artifacts')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })

      if (type) {
        query = query.eq('type', type)
      }

      const { data: artifacts, error } = await query

      if (error) {
        throw new Error(`Failed to get job artifacts: ${error.message}`)
      }

      return artifacts.map(artifact => ({
        id: artifact.id,
        jobId: artifact.job_id,
        type: artifact.type as ArtifactType,
        filename: artifact.filename,
        storagePath: artifact.storage_path,
        publicUrl: artifact.public_url,
        mimeType: artifact.mime_type,
        size: artifact.file_size,
        checksum: artifact.checksum,
        metadata: artifact.metadata,
        createdAt: artifact.created_at
      }))
    } catch (error) {
      console.error('Failed to get job artifacts:', error)
      return []
    }
  }

  /**
   * Download artifact data
   */
  async downloadArtifact(artifactId: string): Promise<Buffer | null> {
    try {
      const artifact = await this.getArtifact(artifactId)
      if (!artifact) {
        return null
      }

      if (this.useSupabaseStorage) {
        return await this.downloadFromSupabase(artifact.storagePath)
      } else {
        return await this.downloadLocally(artifact.storagePath)
      }
    } catch (error) {
      console.error('Failed to download artifact:', error)
      return null
    }
  }

  /**
   * Delete an artifact
   */
  async deleteArtifact(artifactId: string): Promise<boolean> {
    try {
      const artifact = await this.getArtifact(artifactId)
      if (!artifact) {
        return false
      }

      // Delete from storage
      if (this.useSupabaseStorage) {
        await this.deleteFromSupabase(artifact.storagePath)
      } else {
        await this.deleteLocally(artifact.storagePath)
      }

      // Delete database record
      const { error } = await this.supabase
        .from('ceac_artifacts')
        .delete()
        .eq('id', artifactId)

      if (error) {
        console.error('Failed to delete artifact record:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Failed to delete artifact:', error)
      return false
    }
  }

  /**
   * Cleanup old artifacts
   */
  async cleanupOldArtifacts(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      // Get old artifacts
      const { data: oldArtifacts, error } = await this.supabase
        .from('ceac_artifacts')
        .select('id, storage_path')
        .lt('created_at', cutoffDate.toISOString())

      if (error) {
        throw new Error(`Failed to get old artifacts: ${error.message}`)
      }

      let deletedCount = 0

      // Delete each artifact
      for (const artifact of oldArtifacts) {
        try {
          const success = await this.deleteArtifact(artifact.id)
          if (success) {
            deletedCount++
          }
        } catch (error) {
          console.error(`Failed to delete artifact ${artifact.id}:`, error)
        }
      }

      return deletedCount
    } catch (error) {
      console.error('Failed to cleanup old artifacts:', error)
      return 0
    }
  }

  // Private helper methods

  private async storeInSupabase(
    data: Buffer | string,
    metadata: ArtifactMetadata
  ): Promise<{ path: string; publicUrl: string }> {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data)
    const path = `ceac-jobs/${metadata.jobId}/${metadata.type}/${metadata.filename}`

    const { data: uploadData, error } = await this.supabase.storage
      .from('ceac-artifacts')
      .upload(path, buffer, {
        contentType: metadata.mimeType,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(`Failed to upload to Supabase Storage: ${error.message}`)
    }

    const { data: urlData } = this.supabase.storage
      .from('ceac-artifacts')
      .getPublicUrl(path)

    return {
      path: uploadData.path,
      publicUrl: urlData.publicUrl
    }
  }

  private async storeLocally(
    data: Buffer | string,
    metadata: ArtifactMetadata
  ): Promise<string> {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data)
    const relativePath = join(metadata.jobId, metadata.type, metadata.filename)
    const fullPath = join(this.localStoragePath, relativePath)

    // Ensure directory exists
    await mkdir(dirname(fullPath), { recursive: true })

    // Write file
    await writeFile(fullPath, buffer)

    return relativePath
  }

  private async downloadFromSupabase(path: string): Promise<Buffer> {
    const { data, error } = await this.supabase.storage
      .from('ceac-artifacts')
      .download(path)

    if (error || !data) {
      throw new Error(`Failed to download from Supabase Storage: ${error?.message}`)
    }

    return Buffer.from(await data.arrayBuffer())
  }

  private async downloadLocally(path: string): Promise<Buffer> {
    const fullPath = join(this.localStoragePath, path)
    
    if (!existsSync(fullPath)) {
      throw new Error(`Local artifact not found: ${fullPath}`)
    }

    return await readFile(fullPath)
  }

  private async deleteFromSupabase(path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from('ceac-artifacts')
      .remove([path])

    if (error) {
      console.error(`Failed to delete from Supabase Storage: ${error.message}`)
    }
  }

  private async deleteLocally(path: string): Promise<void> {
    const fullPath = join(this.localStoragePath, path)
    
    if (existsSync(fullPath)) {
      await unlink(fullPath)
    }
  }
}

// Lazy singleton instance
let artifactStorageInstance: ArtifactStorage | null = null

export function getArtifactStorage(): ArtifactStorage {
  if (!artifactStorageInstance) {
    artifactStorageInstance = new ArtifactStorage()
  }
  return artifactStorageInstance
}

export default getArtifactStorage
