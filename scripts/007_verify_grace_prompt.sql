SELECT 
  name,
  LEFT(prompt, 200) as prompt_start,
  LENGTH(prompt) as prompt_length,
  RIGHT(prompt, 200) as prompt_end
FROM androids 
WHERE name = 'Grace';
