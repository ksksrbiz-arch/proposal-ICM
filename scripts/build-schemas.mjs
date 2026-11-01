import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const str = {type:'string', minLength:1};
const text = {type:'string', minLength:12};
const strings = {type:'array', items:str};
const sha = {type:'string', pattern:'^[a-f0-9]{64}$'};
const obj = (properties, required=Object.keys(properties)) => ({type:'object', additionalProperties:false, properties, required});
const arr = (items, minItems=0) => ({type:'array', items, minItems});
const en = (...values) => ({type:'string', enum:values});
const packet = properties => obj({schemaVersion:{const:1}, ...properties});
const evidence = obj({path:str, sha256:sha});
const authority = obj({granted:{type:'boolean'}, instruction:{type:'string'}, at:{type:'string'}});
const page = obj({id:str,url:str,title:str,purpose:text,type:en('core','detail','utility','provider'),accessible:{type:'boolean'}});
const defects = arr(obj({id:str,severity:en('critical','high','medium','low'),status:en('open','resolved','deferred'),description:text,disposition:{type:'string'}}));
const definitions = {
 project:packet({projectId:{type:'string',pattern:'^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$'},business:obj({name:str,locality:str}),instructionCommit:{type:'string',pattern:'^[a-f0-9]{40}$'},assignment:text,scope:en('first-site','redesign','refinement'),builder:str,reviewer:str,outputDir:str,permissions:obj({build:authority,publish:authority,tracker:authority,outreach:authority})}),
 research:packet({identity:obj({matched:{type:'boolean'},reason:text,sourceIds:arr(str,1)}),sources:arr(obj({id:str,url:str,checkedAt:str,notes:text}),1),facts:arr(obj({id:str,statement:text,status:en('KNOWN','INFERRED','VERIFY'),sourceIds:strings,publicUse:{type:'boolean'},qualification:{type:'string'}}),1),baseline:obj({status:en('known','no-company-site-found','unknown'),pages:arr(page),checkedUrls:arr(str,1),limitations:{type:'string'}}),differentiators:arr(text,2),primaryJourney:text,launchUnknowns:strings}),
 assets:packet({strategy:text,entries:arr(obj({id:str,kind:en('business-photo','business-logo','generated-illustration','licensed-illustration','font'),path:str,sourceUrl:str,sha256:sha,identityMatched:{type:'boolean'},inspected:{type:'boolean'},allowedForProposal:{type:'boolean'},usageBasis:text}))}),
 design:packet({concept:text,rationale:text,layoutSignature:text,typography:text,palette:arr(str,2),mobileStrategy:text,distinctions:arr(text,3),copy:obj({headline:str,body:text,primaryCta:str}),comparison:text,conceptReviewedBy:str}),
 routes:packet({pages:arr(obj({path:str,title:str,type:en('core','detail','utility'),purpose:text,sections:arr(text,2),sourceIds:strings,assetIds:strings,baselineIds:strings,primaryAction:obj({label:str,kind:en('phone','email','booking','browse','directions','order','local'),target:str})}),1)}),
 flows:packet({entries:arr(obj({id:str,entry:str,description:text,outcome:text,destination:str,behavior:en('local-only','external-handoff','verified-backend')}),1)}),
 implementation:packet({sourceDir:str,buildCommand:str,buildStamp:str,allowlist:arr(str,1),configOnly:strings,flowTestFiles:arr(str,1)}),
 qa:packet({fingerprint:sha,technical:evidence,flows:arr(obj({id:str,passed:{type:'boolean'},evidence}),1),defects}),
 review:packet({fingerprint:sha,reviewedBy:str,coverage:arr(obj({path:str,mobile:evidence,desktop:evidence,observation:text}),1),scores:obj(Object.fromEntries(['specificity','artDirection','copyContent','mobile','journeys','finishAccessibility'].map(k=>[k,{type:'integer',minimum:0,maximum:5}]))),comparison:text,observations:text,ownerInputs:strings}),
 publication:packet({provider:en('cloudflare-pages'),projectName:str,deploymentId:str,status:en('pending','success'),deployedAt:str,buildStamp:str,stableUrl:str,immutableUrl:str,receipt:evidence,hostedQa:evidence,publicVerification:evidence}),
 tracker:packet({projectId:str,applied:{type:'boolean'},writePlan:evidence,before:evidence,after:evidence,preservationVerified:{type:'boolean'},verifiedCells:arr(str,1),tableCoverageVerified:{type:'boolean'}}),
 learning:packet({projectId:str,runId:str,recordedAt:str,architectureUsed:str,outcome:en('completed','blocked','failed','interrupted'),reviewer:str,metrics:obj({routeCases:{type:['integer','null'],minimum:0},flowPasses:{type:['integer','null'],minimum:0},openDefects:{type:['integer','null'],minimum:0},reviewScore:{type:['integer','null'],minimum:0,maximum:30},reworkIterations:{type:['integer','null'],minimum:0}}),observations:arr(obj({id:str,stage:en('brief','research','design','build','qa','review','publish','register','learn'),finding:text,evidence}),1),actions:arr(obj({id:{type:'string',pattern:'^[a-z][a-z0-9-]{2,79}$'},stage:en('brief','research','design','build','qa','review','publish','register'),hypothesis:text,change:text,publicSummary:text,before:evidence,after:evidence,regressionFiles:strings,decision:en('adopt','retain','hold'),reviewedBy:str,privacyReviewed:{type:'boolean'},promotionCommit:{type:'string',pattern:'^$|^[a-f0-9]{40}$'}}),1),nextRunChecklist:arr(text,1)})
};
await mkdir(resolve(root,'schemas'),{recursive:true});
await writeFile(resolve(root,'schemas/artifacts.schema.json'),JSON.stringify({$schema:'http://json-schema.org/draft-07/schema#',$id:'https://github.com/ksksrbiz-arch/proposal-ICM/artifacts.schema.json',definitions},null,2)+'\n');
await writeFile(resolve(root,'schemas/batch.schema.json'),JSON.stringify({$schema:'http://json-schema.org/draft-07/schema#',...packet({batchId:str,instructionCommit:{type:'string',pattern:'^[a-f0-9]{40}$'},rootAgent:str,assignment:text,jobs:arr(obj({projectId:str,projectDir:str,scope:en('first-site','redesign','refinement'),worker:str}),1)})},null,2)+'\n');
console.log('Schemas generated.');
