/**
 * Cria o documento da campanha no Firestore (rode uma vez após criar o projeto).
 *
 * Pré-requisito: credencial de admin
 *   firebase login
 *   gcloud auth application-default login
 *
 * Uso: npm run seed:campaign
 */
const admin = require('firebase-admin')

const CAMPAIGN_ID = 'operacao-setembro-2026'

admin.initializeApp({ projectId: CAMPAIGN_ID })

const db = admin.firestore()

async function main() {
  const ref = db.collection('campaigns').doc(CAMPAIGN_ID)
  const snap = await ref.get()

  if (snap.exists) {
    console.log(`Campanha "${CAMPAIGN_ID}" já existe.`)
    return
  }

  await ref.set({
    name: 'Operação Setembro',
    year: 2026,
    startDate: admin.firestore.Timestamp.fromDate(new Date(2026, 8, 1)),
    endDate: admin.firestore.Timestamp.fromDate(new Date(2026, 8, 30, 23, 59, 59, 999)),
    status: 'active',
    registrationDeadline: '2026-09-04',
  })

  console.log(`Campanha "${CAMPAIGN_ID}" criada com sucesso.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro ao criar campanha:', err.message)
    console.error('\nAlternativa manual: Firebase Console → Firestore → campaigns → operacao-setembro-2026')
    process.exit(1)
  })
