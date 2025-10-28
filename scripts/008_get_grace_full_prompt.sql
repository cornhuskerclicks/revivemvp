SELECT 
  name,
  prompt,
  length(prompt) as prompt_length
FROM androids 
WHERE name = 'Grace';
