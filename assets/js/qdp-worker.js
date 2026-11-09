'use strict';

importScripts('qdp_engine.js');

self.onmessage = function (event) {
    try {
        if (typeof QDPEngine !== 'function') {
            throw new Error('O mecanismo QDP não foi carregado no processo em segundo plano.');
        }
        const engine = new QDPEngine(event.data);
        const result = engine.gerarGradeCompleta();
        self.postMessage({ result: result });
    } catch (error) {
        self.postMessage({
            error: error && error.message ? error.message : 'Erro inesperado durante a geração QDP.',
            stack: error && error.stack ? error.stack : ''
        });
    }
};
