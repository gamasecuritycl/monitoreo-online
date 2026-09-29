async function testBot() {
  const payload = {
    sessionId: `test-${Date.now()}`,
    message: 'Hola, me interesa la promoción: "🔥 Promoción Exclusiva Pack VETTI Smart". ¿Me das los detalles y valores?',
    history: []
  };

  console.log('Enviando consulta al chatbot de www.gamasecurity.cl...');
  const res = await fetch('https://www.gamasecurity.cl/api/sales-gama/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    console.error('Error status:', res.status, await res.text());
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.replace('data: ', ''));
          if (data.type === 'chunk' && data.text) {
            fullText += data.text;
          }
        } catch {}
      }
    }
  }

  console.log('\n--- RESPUESTA COMPLETA DEL CHATBOT ---');
  console.log(fullText);
  console.log('--------------------------------------\n');
}

testBot().catch(console.error);
