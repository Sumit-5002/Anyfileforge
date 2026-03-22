import { parseIpynb } from './src/services/researcher/ipynbService.js';

const mockFile = {
    text: async () => '{"cells":[{"cell_type":"markdown","source":["# Hello\\n","World"]}]}'
};

parseIpynb(mockFile).then(res => {
    console.log('SUCCESS', res);
}).catch(err => {
    console.error('ERROR', err);
});
