import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const FIREBASE_BASE_URL = 'https://esp-api-10fa5-default-rtdb.firebaseio.com'
    
    const [circuitResponse, ledResponse, sistemaResponse] = await Promise.all([
      fetch(`${FIREBASE_BASE_URL}/circuito.json`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }),
      fetch(`${FIREBASE_BASE_URL}/led.json`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }),
      fetch(`${FIREBASE_BASE_URL}/sistema.json`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
    ])

    if (!circuitResponse.ok || !ledResponse.ok || !sistemaResponse) {
      throw new Error(`HTTP Error: ${circuitResponse.status} / ${ledResponse.status} / ${sistemaResponse}`)
    }

    const circuitData = await circuitResponse.json()
    const ledData = await ledResponse.json()
    const sistemaData = await sistemaResponse.json()
    const allData = circuitData + ledData + sistemaData

    return Response.json({
      allData: allData
    })
  } catch (error) {
    console.error('Erro ao buscar dados do sistema:', error)
    return Response.json(
      { error: 'Erro ao buscar dados do sistema' },
      { status: 500 }
    )
  }
}
