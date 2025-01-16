const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

const dotenv = require('dotenv');
dotenv.config();

const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL; // URL da loja Shopify
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;


// Dados de autenticação Shopify


// Middleware para permitir JSON no corpo da requisição
app.use(express.json());

// Tabela de frete por estado
const tabelaFrete = {
    AC: 30.94, AP: 30.94, AM: 30.94, PA: 30.94, RO: 30.94, RR: 30.94, TO: 30.94,
    AL: 30.94, BA: 30.94, CE: 30.94, MA: 30.94, PB: 30.94, PE: 30.94, PI: 30.94, RN: 30.94, SE: 30.94,
    DF: 21.29, GO: 21.29, MT: 21.29, MS: 21.29,
    ES: 18.21, MG: 18.21, RJ: 18.21, SP: 13.95,
    PR: 18.96, RS: 18.96, SC: 18.96
};

// Função para validar o CEP usando a API ViaCEP (caso necessário)
async function validarCep(cep) {
    try {
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        if (response.data.erro) {
            return null; // Retorna null se o CEP for inválido
        }
        return response.data; // Retorna os dados do endereço se válido
    } catch (error) {
        console.error('Erro ao validar o CEP:', error);
        return null; // Em caso de erro, retorna null
    }
}

// Endpoint para processar webhook da Shopify
app.post('/calcularfrete', async (req, res) => {
    try {
        console.log('Payload recebido:', JSON.stringify(req.body, null, 2));

        // Dados do webhook
        const { checkout } = req.body;

        if (!checkout) {
            return res.status(400).json({ error: 'Dados do checkout não encontrados.' });
        }

        const { shipping_address, line_items } = checkout;

        if (!shipping_address || !line_items) {
            return res.status(400).json({ error: 'Dados insuficientes para calcular o frete.' });
        }

        const estado = shipping_address.province_code; // Código do estado (ex.: SP, RJ)
        const cep = shipping_address.zip; // CEP do endereço de entrega

        // Validação do CEP (opcional, caso você queira validar o CEP)
        const dadosCep = await validarCep(cep);
        if (!dadosCep) {
            return res.status(400).json({ error: 'CEP inválido.' });
        }

        // Validações do estado
        if (!tabelaFrete[estado]) {
            return res.status(400).json({ error: 'Estado inválido ou não suportado.' });
        }

        // Cálculo do frete
        const quantidadeTotal = line_items.reduce((total, item) => total + item.quantity, 0);
        const valorBase = tabelaFrete[estado];
        const adicionalPorItem = 5;
        const totalFrete = valorBase + (quantidadeTotal - 1) * adicionalPorItem;

        // Resposta para a Shopify com o valor do frete calculado
        res.json({
            rates: [
                {
                    service_name: 'Frete Personalizado',
                    service_code: 'FRETE_PERSONALIZADO',
                    total_price: (totalFrete * 100).toString(), // Preço em centavos
                    currency: 'BRL',
                }
            ]
        });
    } catch (error) {
        console.error('Erro ao processar webhook:', error);
        res.status(500).json({ error: 'Erro interno ao processar o webhook.' });
    }
});

// Função para criar o webhook na Shopify
async function criarWebhook() {
    const webhookData = {
        webhook: {
            topic: 'checkouts/update',
            address: 'https://frete.fly.dev/calcularfrete', // URL do seu servidor
            format: 'json',
        }
    };

    try {
        const response = await axios.post(`${SHOPIFY_STORE_URL}/admin/api/2023-01/webhooks.json`, webhookData, {
            headers: {
                'X-Shopify-Access-Token': ACCESS_TOKEN,
                'Content-Type': 'application/json',
            },
        });
        console.log('Webhook criado com sucesso:', response.data);
    } catch (error) {
        console.error('Erro ao criar o webhook:', error.response.data);
    }
}

// Chama a função para criar o webhook (você pode chamar isso uma vez durante a configuração inicial)
criarWebhook();

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
