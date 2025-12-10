import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URL
const options = {}

if (!uri) {
  throw new Error('Please define the MONGODB_URL environment variable in .env.local')
}

let client
let clientPromise

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export const getDatabase = async () => {
  const client = await clientPromise
  return client.db(process.env.DATABASE_NAME || 'task-manager')
}

// Collection names
export const COLLECTIONS = {
  COMPETITOR_PRICES: 'antigravity_price_dcor',
  OWN_PRODUCTS: 'antigravity_products_dcor',
  USERS: process.env.LOGIN_COLLECTION || process.env.COLLECTION_NAME_LOGIN || 'users'
}

export default clientPromise
