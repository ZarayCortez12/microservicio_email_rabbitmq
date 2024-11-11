import app from './app.js';
import { consumeMessages } from './controllers/user.controller.js';  // Importas la función

app.listen(3005);
console.log('Server started on port 3005');

consumeMessages();