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

    const exchange = "logExchange"; // Nombre del exchange
    const queue = "InfoQueue"; // Nombre de la cola
    const routingKey = "registro"; // Routing key para el bind

    // Asegúrate de que el exchange sea duradero
    await channel.assertExchange(exchange, "direct", { durable: true });

    // Asegúrate de que la cola sea duradera y exista
    const q = await channel.assertQueue(queue, { durable: true });

    // Verifica si la cola existe en el canal
    if (q.queue) {
      console.log(`Cola '${queue}' creada correctamente.`);
    } else {
      console.error("La cola no se ha creado correctamente.");
    }

    // Vincula la cola al exchange con la routing key
    await channel.bindQueue(q.queue, exchange, routingKey);

    console.log("Esperando mensajes en la cola:", queue);

    // Consumir mensajes de la cola
    channel.consume(q.queue, async (msg) => {
      if (msg !== null) {
        const data = JSON.parse(msg.content.toString()); // Parsear el mensaje JSON
        console.log("Datos recibidos:", data);

        const email = data.user.correo; // Extraer el correo del mensaje
        const nombre = data.user.nombres; // Extraer el nombre del usuario

        // Llamar a la función sendEmail con el correo del usuario
        try {
          await sendEmail(email, nombre); // Llamar a la función para enviar el correo
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
        <div style="font-family: Arial, sans-serif; color: #333; display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center;">
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
