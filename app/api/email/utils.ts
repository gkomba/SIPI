import fs  from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

export function gerarEmailPoste(data) {
    const htmlTemplate = fs.readFileSync(
    path.join(__dirname, 'template.html'),
    'utf8'
  )
  return htmlTemplate
    .replace('{{postes}}', data.postes)
    .replace('{{time}}', data.lastUpdate)
}
