import mongoose from 'mongoose'

export class MongooseSingleton {
  private static instance: MongooseSingleton

  private constructor () {
    mongoose.connect(`mongodb://${COMPUTED_CONSTANTS.mongoHost}:${COMPUTED_CONSTANTS.mongoPort}/${COMPUTED_CONSTANTS.mongoDatabase}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
  }

  public static getInstance (): MongooseSingleton {
    if (!MongooseSingleton.instance) {
      MongooseSingleton.instance = new MongooseSingleton()
    }
    return MongooseSingleton.instance
  }
}
