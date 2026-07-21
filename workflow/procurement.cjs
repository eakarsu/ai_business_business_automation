const transitions = { SUBMITTED:['UNDER_EVALUATION','REJECTED'], UNDER_EVALUATION:['EVALUATED','REJECTED'], EVALUATED:['AWARDED','REJECTED'] };
function validateVendor(input) { if (!input?.name || (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))) throw new Error('invalid vendor'); return input; }
function transitionBid(status,target,actor) { if (!['ADMIN','PROCUREMENT_MANAGER','EVALUATOR'].includes(actor.role)) throw new Error('forbidden'); if (!transitions[status]?.includes(target)) throw new Error('invalid transition'); return {status:target,actorId:actor.id}; }
function validateAIResult(result) { if (!result || typeof result.overallScore !== 'number' || result.overallScore < 0 || result.overallScore > 100 || !Array.isArray(result.recommendations)) throw new Error('invalid AI result'); return result; }
module.exports={validateVendor,transitionBid,validateAIResult};
