export const extractFacts = async (transcript) => {
  if (!transcript) return 'No audio data extracted.';

  const response = await fetch(
    'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: transcript,
        parameters: { max_length: 150 }
      })
    }
  );

  if (!response.ok) {
    console.error('HF API error:', response.statusText);
    return transcript;
  }

  const data = await response.json();
  return data[0]?.summary_text || transcript;
};
