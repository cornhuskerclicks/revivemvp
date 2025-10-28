SELECT name, 
       LENGTH(prompt) as prompt_length,
       prompt
FROM androids 
WHERE name = 'Grace'
LIMIT 1;
