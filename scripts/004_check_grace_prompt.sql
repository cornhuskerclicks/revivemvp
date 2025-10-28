-- Check what prompt the Grace android currently has
SELECT name, LEFT(prompt, 200) as prompt_preview
FROM androids
WHERE name = 'Grace'
LIMIT 1;
