const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware para interpretar JSON
app.use(bodyParser.json());

// Credenciais da Shopify
const API_KEY = '6430407dc0ac99fa1fa2149d51d07997';
const API_SECRET = '27055a76e75523517c404f15085a4fc';
const ACCESS_TOKEN = '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';
const SHOPIFY_STORE_URL = 'https://gr0p9a-63.myshopify.com';

// Função para calcular o frete com base na região
const calcularFrete = (endereco) => {
  console.log('Calculando frete...');
  console.log('Endereço recebido:', endereco);

  // Extraindo a região (província, cidade ou país)
  let regiao = endereco.province || endereco.city || endereco.country || 'desconhecido';
  console.log(`Região extraída do endereço: ${regiao}`);

  // Lógica simples de cálculo de frete com base na região
  const taxas = {
    'norte': 15,
    'sul': 10,
    'leste': 12,
    'oeste': 20
  };

  // Obter a taxa da região ou aplicar uma taxa padrão
  const taxa = taxas[regiao.toLowerCase()] || 10; 
  console.log(`Taxa de frete para a região "${regiao}": ${taxa}%`);

  return taxa;
};

// Função para atualizar a taxa de frete no Shopify
const atualizarFreteShopify = async (checkoutId, taxaFrete) => {
  const payload = {
    "shipping_rates": [
      {
        "title": "Fretagem personalizada",
        "price": taxaFrete.toFixed(2),
        "code": "custom_shipping_rate",
        "source": "Custom"
      }
    ]
  };

  try {
    const response = await axios.post(
      `${SHOPIFY_STORE_URL}/admin/api/2023-01/checkouts/${checkoutId}/shipping_rates.json`,
      payload,
      {
        headers: {
          'X-Shopify-Access-Token': ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Frete atualizado no Shopify:', response.data);
  } catch (error) {
    console.error('Erro ao atualizar o frete no Shopify:', error.response ? error.response.data : error.message);
  }
};

// Endpoint para receber o webhook do Shopify
app.post('/webhook-shopify', (req, res) => {
  console.log('Webhook Shopify recebido!');
  console.log('Dados do checkout:', req.body);

  const { shipping_address, shipping_lines, total_price, id: checkoutId } = req.body;

  // Verifica se os dados necessários estão presentes
  if (!shipping_address || !shipping_lines || !total_price || !checkoutId) {
    console.log('Erro: Dados obrigatórios não encontrados!');
    return res.status(400).json({ error: 'Dados obrigatórios não encontrados' });
  }

  // Usar a função para calcular a taxa de frete com base no endereço
  const taxaFrete = calcularFrete(shipping_address);
  const valorCompra = parseFloat(total_price); // Valor total da compra
  console.log(`Valor total da compra: ${valorCompra}`);

  // Atualizar a taxa de frete no Shopify
  atualizarFreteShopify(checkoutId, taxaFrete);

  // Responder com sucesso para Shopify
  res.status(200).json({ success: true });
  console.log('Cálculo de frete concluído. Resposta enviada.');
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`API rodando na porta ${port}`);
});
