const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

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

// Endpoint para processar webhook da Shopify
app.post('/calcularfrete', async (req, res) => {
    try {

        console.log('Payload recebido:', JSON.stringify(req.body, null, 2));
        // Dados do webhook
        const { shipping_address, line_items } = req.body;

        
        if (!shipping_address || !line_items) {
            return res.status(400).json({ error: 'Dados insuficientes para calcular o frete.' });
        }

        const estado = shipping_address.province_code; // Código do estado (ex.: SP, RJ)
        const quantidadeTotal = line_items.reduce((total, item) => total + item.quantity, 0);

        // Validações
        if (!tabelaFrete[estado]) {
            return res.status(400).json({ error: 'Estado inválido ou não suportado.' });
        }

        const valorBase = tabelaFrete[estado];
        const adicionalPorItem = 5;
        const totalFrete = valorBase + (quantidadeTotal - 1) * adicionalPorItem;

        // Resposta para Shopify
        res.json({
            fulfillment_service: 'manual',
            shipping_lines: [
                {
                    title: 'Frete Personalizado',
                    price: totalFrete.toFixed(2),
                    code: 'FRETE_PERSONALIZADO'
                }
            ]
        });
    } catch (error) {
        console.error('Erro ao calcular frete:', error);
        res.status(500).json({ error: 'Erro interno ao calcular frete.' });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

