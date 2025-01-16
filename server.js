const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Middleware para processar JSON
app.use(bodyParser.json());

// Função para calcular o frete com base na região
const calcularFrete = (regiao, valorCompra) => {
  console.log(`Calculando frete...`);
  console.log(`Região recebida: ${regiao}`);
  console.log(`Valor da compra: ${valorCompra}`);

  const taxas = {
    'norte': 15,
    'sul': 10,
    'leste': 12,
    'oeste': 20
  };

  const taxa = taxas[regiao.toLowerCase()] || 10; // Taxa padrão se a região não for encontrada
  console.log(`Taxa de frete para a região "${regiao}": ${taxa}%`);

  const frete = valorCompra * (taxa / 100);
  console.log(`Valor do frete calculado: ${frete}`);

  return frete;
};

// Endpoint para o webhook do Shopify
app.post('/webhook-shopify', (req, res) => {
  console.log('Webhook Shopify recebido!');
  console.log('Dados do checkout:', req.body);

  const { shipping_address, shipping_lines, total_price } = req.body;

  // Verifica se os dados necessários estão presentes
  if (!shipping_address || !shipping_lines || !total_price) {
    console.log('Erro: Dados obrigatórios não encontrados!');
    return res.status(400).json({ error: 'Dados obrigatórios não encontrados' });
  }

  const regiao = shipping_address.province || 'desconhecido'; // Usa a província como região
  const valorCompra = parseFloat(total_price); // Valor total da compra

  console.log(`Região extraída do endereço: ${regiao}`);
  console.log(`Valor total da compra: ${valorCompra}`);

  // Calcular o frete
  const frete = calcularFrete(regiao, valorCompra);

  // Enviar a resposta com o valor do frete
  res.json({ frete });
  console.log('Cálculo de frete concluído. Resposta enviada.');
});

// Inicia o servidor na porta 3000
app.listen(3000, () => {
  console.log('API rodando na porta 3000');
});
