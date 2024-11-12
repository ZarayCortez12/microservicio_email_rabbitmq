import amqp from "amqplib";
import sendEmails from "../sendEmail.js"; // Asegúrate de importar tu función sendEmail correctamente
import path from "path";
import fs from "fs";
import handlebars from "handlebars";

export async function consumeMessages() {
    try {
      // Establecer conexión con RabbitMQ
      const connection = await amqp.connect("amqp://localhost");
      const channel = await connection.createChannel();
  
      const exchange1 = "logExchange";    // Primer exchange
      const exchange2 = "logExchangeTwo"; // Segundo exchange
      const queue = ""; // Deja la cola sin nombre para que RabbitMQ asigne una cola temporal única
  
      // Declara los exchanges como tipo 'fanout'
      await channel.assertExchange(exchange1, "fanout", { durable: true });
      await channel.assertExchange(exchange2, "fanout", { durable: true });
  
      // Crea una cola temporal y enlázala a ambos exchanges
      const q = await channel.assertQueue(queue, { exclusive: true });
  
      // Vincula la cola al primer exchange
      await channel.bindQueue(q.queue, exchange1, "");
      // Vincula la cola al segundo exchange
      await channel.bindQueue(q.queue, exchange2, "");
  
      console.log("Esperando mensajes en los exchanges 'logExchange' y 'logExchangeTwo'...");
  
      // Consumir mensajes de la cola
      channel.consume(q.queue, async (msg) => {
        if (msg !== null) {
          const data = JSON.parse(msg.content.toString());
          console.log("Datos recibidos:", data);
  
          // Identificar desde qué exchange proviene el mensaje
          const exchangeName = data.exchangeName;  // Asumiendo que el mensaje tiene un campo `exchangeName`
  
          const email = data.user.correo; // Extraer el correo del mensaje
          const nombre = data.user.nombres; // Extraer el nombre del usuario
          console.log("esto es exchange", exchangeName);
          // Diferenciar el método según el exchange
          try {
            if (exchangeName === exchange1) {
                console.log("Mensaje recibido desde 'logExchange'. Enviando correo de registro...");
                await sendEmail(email, nombre); // Método para 'logExchange'
            } else if (exchangeName === exchange2) {
                console.log("Mensaje recibido desde 'logExchangeTwo'. Enviando correo de bienvenida...");
                await sendEmailWelcome(email, nombre); // Método específico para 'logExchangeTwo'
            }
          } catch (error) {
            console.error("Error al enviar el correo:", error);
          }
  
          channel.ack(msg); // Confirmar que el mensaje fue procesado
        }
      });
    } catch (error) {
      console.error("Error al consumir los mensajes:", error);
    }
  }

export const sendEmail = async (email, nombre) => {
  try {
    // Mensaje personalizado y atractivo para el correo
    const subject = "¡Bienvenido a nuestra plataforma!";
    const htmlToSend = `
        <div style="font-family: Arial, sans-serif; color: #333; justify-content: center; align-items: center; height: 100vh; text-align: center;">
          <h1 style="color: #4CAF50;">¡Bienvenido, ${nombre}!</h1>
          <p>Gracias por registrarte en nuestra plataforma. Estamos muy emocionados de tenerte con nosotros y estamos seguros de que disfrutarás de la experiencia.</p>
          <p>Haz clic en el siguiente botón para iniciar sesión y comenzar a explorar:</p>
          <a href="http://localhost:5173/login" style="
            display: inline-block;
            padding: 10px 20px;
            margin: 10px 0;
            font-size: 16px;
            color: #fff;
            background-color: #4CAF50;
            text-decoration: none;
            border-radius: 5px;
          ">Iniciar sesión</a>
          <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
          <p>¡Nos vemos dentro!</p>
        </div>
      `;

    // Aquí deberías tener tu función `sendEmails` para enviar el correo
    await sendEmails(email, subject, htmlToSend);
  } catch (error) {
    console.error("Error:", error);
  }
};

export const sendEmailWelcome = async (email, nombre) => {
    try {
      // Mensaje personalizado y atractivo para el correo
      const subject = "¡Te tenemos una gran sorpresa!";
      const htmlToSend = `
          <div style="font-family: Arial, sans-serif; color: #333; justify-content: center; align-items: center; height: 100vh; text-align: center;">
            <h1 style="color: #4CAF50;">¡Hola de vuelta, ${nombre}!</h1>
            <p>Para que veas lo muy felices que estamos de tenerte, te damos la bienvenida a nuestra plataforma.</p>
            <p>Con un regalo especial</p>
            <a href="http://localhost:5173/login" style="
              display: inline-block;
              padding: 10px 20px;
              margin: 10px 0;
              font-size: 16px;
              color: #fff;
              background-color: #4CAF50;
              text-decoration: none;
              border-radius: 5px;
            ">Revisa los detalles</a>
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
            <p>¡Nos vemos dentro!</p>
          </div>
        `;
  
      // Aquí deberías tener tu función `sendEmails` para enviar el correo
      await sendEmails(email, subject, htmlToSend);
    } catch (error) {
      console.error("Error:", error);
    }
  };