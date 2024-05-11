const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
require("dotenv").config

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MongoAdapter = require('@bot-whatsapp/database/mongo')

const chat = require("./chatGPT")
const { handlerAI } = require("./whisper")

const { readMessage } = require("./util")

const catalogo = readMessage("mensajes", "catalogo.txt")
const areaDeServicio = readMessage("mensajes", "areaDeServicio.txt")
const hola = readMessage("mensajes", "hola.txt")
const promptConsultas = readMessage("mensajes", "promptConsultas.txt")

const { catalogoKeywords, holaKeywords, areaDeServicioKeywords, representanteKeywords } = require("./keywords")



const flowVoice = addKeyword(EVENTS.VOICE_NOTE).addAnswer("Esta es una nota de voz", null, async (ctx, ctxFn) => {
    const text = await handlerAI(ctx)
    const prompt = promptConsultas
    const consulta = text
    const answer = await chat(prompt, consulta)
    await ctxFn.flowDynamic(answer.content)
})

const flowCatalogoEstudio = addKeyword(EVENTS.ACTION)
    .addAnswer('Este es el menu de seccion de fotos de Estudio', {
        delay: 200,
        media: "https://pub-da38acb9ba7f47ed994e9606e49185fa.r2.dev/Propuesta%20Fotogr%C3%A1fica%20Estudio.pdf"
    })

const flowCatalogoExterior = addKeyword(EVENTS.ACTION)
    .addAnswer('Este es el menu de seccion de fotos de Exteriores', {
        delay: 200,
        media: "https://pub-da38acb9ba7f47ed994e9606e49185fa.r2.dev/Propuesta%20Fotogr%C3%A1fica%20Exterior.pdf"
    })


const flowConsultas = addKeyword(EVENTS.ACTION)
    .addAnswer('Este es el flow consultas')
    .addAnswer("Hace tu consulta", { capture: true }, async (ctx, ctxFn) => {
        const prompt = promptConsultas
        const consulta = ctx.body
        const answer = await chat(prompt, consulta)
        await ctxFn.flowDynamic(answer.content)
    })



const catalogoFlow = addKeyword(catalogoKeywords).addAnswer(
    catalogo,
    { capture: true },
    async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
        if (!["1", "2", "3", "0"].includes(ctx.body)) {
            return fallBack(
                "Respuesta no válida, por favor selecciona una de las opciones."
            );
        }
        switch (ctx.body) {
            case "1":
                return gotoFlow(flowCatalogoEstudio);
            case "2":
                return gotoFlow(flowCatalogoExterior);
            case "3":
                return gotoFlow(flowConsultas);
            case "0":
                return await flowDynamic(
                    "Saliendo... Puedes volver a acceder a este menú escribiendo '*Menu*'"
                );
        }
    }
);

const flowHola = addKeyword(holaKeywords).addAnswer(hola, {
    delay: 100,
    media: "https://pub-da38acb9ba7f47ed994e9606e49185fa.r2.dev/Logo.png",
   
})

const flowAreaDeServicio = addKeyword(areaDeServicioKeywords).addAnswer(areaDeServicio, {
    delay: 100,
})

const flowRepresentante = addKeyword(representanteKeywords).addAnswer("Por favor, escribele al siguiente numero de whatsapp +1 (829) 111-1111 y te atendera nuestro representante con mucho gusto")
const AllFlow = [
    catalogoFlow,
    flowCatalogoEstudio,
    flowCatalogoExterior,
    flowConsultas,
    flowVoice,
    flowHola,
    flowAreaDeServicio,
    flowRepresentante,
]
const main = async () => {
    const adapterDB = new MongoAdapter({
        dbUri: process.env.MONGO_DB_URL,
        dbName: "bot-whatsapp",
    })
    const adapterFlow = createFlow(AllFlow)
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}
main()