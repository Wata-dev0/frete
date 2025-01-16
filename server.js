const express = require('express');
const app = express();

// Middleware para permitir o envio de JSON
app.use(express.json());

// Simulação de uma lógica para cálculo de frete
const calcularFrete = (regiao, valor) => {
  const taxas = {
    'norte': 15,
    'sul': 10,
    'leste': 12,
    'oeste': 20
  };
  
  const taxa = taxas[regiao.toLowerCase()] || 10; // Se a região não for encontrada, retorna 10% como padrão
  return valor * (taxa / 100);
};

// Rota para calcular o frete
app.post('/calcular-frete', (req, res) => {
  const { regiao, valorCompra, shopify } = req.body;

  if (!regiao || !valorCompra || !shopify) {
    return res.status(400).json({ error: 'Faltando dados obrigatórios' });
  }

  const frete = calcularFrete(regiao, valorCompra);
  res.json({ frete });
});

// Inicia o servidor na porta 3000
app.listen(3000, () => {
  console.log('API rodando na porta 3000');
});
