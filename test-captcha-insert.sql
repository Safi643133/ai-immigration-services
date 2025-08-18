-- Test inserting a CAPTCHA challenge manually
INSERT INTO ceac_captcha_challenges (
  job_id,
  image_url,
  input_selector,
  submit_selector,
  refresh_selector,
  expires_at,
  solved
) VALUES (
  '00e3c351-ec02-4dda-996a-1a55b1460c41',
  'https://ceac.state.gov/GenNIV/BotDetectCaptcha.ashx?get=image&c=c_default_ctl00_sitecontentplaceholder_uclocation_identifycaptcha1_defaultcaptcha&t=test123',
  '#ctl00_SiteContentPlaceHolder_ucLocation_IdentifyCaptcha1_txtCodeTextBox',
  'input[type="submit"]',
  '.LBD_ReloadLink',
  NOW() + INTERVAL '5 minutes',
  false
) RETURNING *;

-- Check if the insert worked
SELECT * FROM ceac_captcha_challenges WHERE job_id = '00e3c351-ec02-4dda-996a-1a55b1460c41';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'ceac_captcha_challenges';

