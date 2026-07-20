export interface ConversationReply {
  reply: string
  topic: 'greeting' | 'help' | 'capability' | 'guided'
}

const GREETING = /^(hi|hello|hey|good\s+(morning|afternoon|evening)|namaste|namaskara|ನಮಸ್ಕಾರ|ಹಾಯ್)[!.\s]*$/i
const HELP = /(help|what can you do|how (do|can) i use|how does this work|features?)/i
const CAPABILITY = /(what is crimesight|what.*(proof before action|governed|human review)|explain.*(system|platform|dashboard))/i
const THANKS = /^(thanks|thank you|thx)[!.\s]*$/i

/** A polished safe fallback while the optional QuickML service is unavailable. */
export function getConversationFallback(input: string): ConversationReply {
  const message = input.trim()

  if (GREETING.test(message)) {
    return {
      topic: 'greeting',
      reply: 'Hello — I’m **CrimeSight AI**. I can explain this prototype or answer verified questions about its synthetic FIR dataset.\n\nTry: **“Show high-risk cybercrime FIRs in Mysuru”** or ask **“What can you do?”**',
    }
  }

  if (THANKS.test(message)) {
    return {
      topic: 'greeting',
      reply: 'You’re welcome. I’m ready to help with a verified FIR query or explain a CrimeSight feature.',
    }
  }

  if (HELP.test(message)) {
    return {
      topic: 'help',
      reply: '**CrimeSight AI can help in two ways:**\n- Explain the prototype, its safeguards, and how to use each view.\n- Answer FIR intelligence questions against the reproducible synthetic dataset, with filters and matching records shown as proof.\n\nIt does not make enforcement decisions or use live police data.',
    }
  }

  if (CAPABILITY.test(message)) {
    return {
      topic: 'capability',
      reply: '**CrimeSight** is a governed intelligence prototype for human review. “Proof before action” means every FIR recommendation is accompanied by its matching filters, record count, and evidence cues before an officer can approve, request evidence, or dismiss it.',
    }
  }

  return {
    topic: 'guided',
    reply: 'I can help explain CrimeSight or answer a verified FIR question from this synthetic dataset. For example: **“How many repeat-pattern FIRs are open?”**',
  }
}
