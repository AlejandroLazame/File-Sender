import { Service } from 'node-windows';
import path from 'path';

const servicePath = path.join(__dirname, 'app.js');

const service = new Service({
    name: 'Enviar Danfe',
    description: 'Serviço para replicar os pdfs das Danfes no servidor de integração com o Serra Park',
    script: servicePath
});

service.on('install', ()=>{
    console.log('Servico instalado com sucesso!');
    service.start();
});

service.on('uninstall', ()=>{
    console.log('Serviço desinstalado com sucesso!');
});

service.install();