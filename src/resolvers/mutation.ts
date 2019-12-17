import { IResolvers } from "graphql-tools";
import {
  getCharacters,
  getCharacter,
  asignVoteId,
  getVote
} from "../lib/database-operations";
import { Datetime } from "../lib/datetime";
import { COLLECTIONS, CHANGE_VOTES } from '../config/constants';

async function response(status: boolean, message: string, db: any) {
    return {
        status,
        message,
        characters: await getCharacters(db)
    }
}

async function sendNotification(pubsub: any, db: any) {
  pubsub.publish(CHANGE_VOTES, { changeVotes: await getCharacters(db)})
}

const mutation: IResolvers = {
  Mutation: {
    async addVote(_: any, { character }, { db, pubsub }) {
      // Verificar si existe el personaje

      const selectCharacter = await getCharacter(db, character);

      if (selectCharacter === null || selectCharacter === undefined) {
        return response(false,"No puedes votar el personaje no existe", db);
        // return {
        //   status: false,
        //   message: "No puedes votar el personaje no existe",
        //   characters: await getCharacters(db)
        // };
      }

      // Obtener el id del voto.

      const vote = {
        id: await asignVoteId(db),
        character,
        createdAt: new Datetime().getCurrentDateTime()
      };
      console.log(vote);

      return await db
        .collection(COLLECTIONS.VOTES)
        .insertOne(vote)
        .then(async () => {
          sendNotification(pubsub, db);
          return response(true,"El personaje existe y se ha emitido el voto", db);
          // return {
          //   status: true,
          //   message: "El personaje existe y se ha emitido el voto",
          //   characters: await getCharacters(db)
          // };
        })
        .catch(async () => {
          return response(true,"El voto no se ha emitido, prueba de nuevo", db);
          // return {
          //   status: false,
          //   message: "El voto no se ha emitido, prueba de nuevo",
          //   characters: await getCharacters(db)
          // };
        });
    },
    async updateVote(_: any, { id, character }, { db, pubsub }) {
      // Personaje Exista
      const selectCharacter = await getCharacter(db, character);

      if (selectCharacter === null || selectCharacter === undefined) {
        return response(false,"No puedes votar el personaje no existe", db);
        // return {
        //   status: false,
        //   message: "No puedes votar el personaje no existe",
        //   characters: await getCharacters(db)
        // };
      }
      // El voto exista
      const selectVote = await getVote(db, character);

      if (selectVote === null || selectVote === undefined) {
        return response(false,"El voto introducido no existe y no puedes actualizar el voto", db);
        // return {
        //   status: false,
        //   message:
        //     "El voto introducido no existe y no puedes actualizar el voto",
        //   characters: await getCharacters(db)
        // };
      }

      // Actualizacion del voto

      return await db
        .collection(COLLECTIONS.VOTES)
        .updateOne({ id }, { $set: { character } })
        .then(async () => {
          sendNotification(pubsub, db);
          return response(true,"Voto actualizado correctamente", db);
          // return {
          //   status: true,
          //   message: "Voto actualizado correctamente",
          //   characters: getCharacters(db)
          // };
        })
        .catch(async () => {
        return response(false,"Voto NO actualizado correctamente. Prueba de nuevo", db);
          // return {
          //   status: false,
          //   message: "Voto NO actualizado correctamente. Prueba de nuevo",
          //   characters: getCharacters(db)
          // };
        });
    },
    async deleteVote(_: any, { id }, { db, pubsub }) {

        // si existe el voto

        const selectVote = await getVote(db, id);

        if (selectVote === null || selectVote === undefined) {
          return response(false,"El voto introducido no existe y no puedes borrar el voto", db);
          // return {
          //   status: false,
          //   message:
          //     "El voto introducido no existe y no puedes borrar el voto",
          //   characters: await getCharacters(db)
          // };
        }

      return await db
        .collection(COLLECTIONS.VOTES)
        .deleteOne({ id })
        .then(async () => {
          sendNotification(pubsub, db);
          return response(true,"El voto ha sido eliminado", db);
          // return {
          //   status: true,
          //   message: "El voto ha sido eliminado",
          //   characters: getCharacters(db)
          // };
        })
        .catch(async () => {
          return response(false,"El voto no se ha eliminado correctamente. Intenta de nuevo", db);
          // return {
          //   status: false,
          //   message:
          //     "El voto no se ha eliminado correctamente. Intenta de nuevo",
          //   characters: getCharacters(db)
          // };
        });
    }
  }
};

export default mutation;
