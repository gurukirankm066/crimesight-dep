import { DEMO_SUSPECTS } from '@/lib/demo-data'

export async function GET() {
  // Build network graph from demo suspects
  const nodes = DEMO_SUSPECTS.slice(0, 30).map(s => ({
    id: s.suspect_name,
    group: s.arrest_status === 'Absconding' ? 'absconding' : 'arrested',
    crimeCount: Math.floor(Math.random() * 5 + 1),
  }))

  // Create links between suspects who share cases
  const links: Array<{ source: string; target: string; weight: number }> = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < Math.min(nodes.length, i + 5); j++) {
      if (Math.random() > 0.5) {
        links.push({
          source: nodes[i].id,
          target: nodes[j].id,
          weight: Math.floor(Math.random() * 3 + 1),
        })
      }
    }
  }

  return Response.json({ nodes, links })
}