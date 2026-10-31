const emptyRef=()=>({path:'',sha256:'0'.repeat(64)});
const grant=()=>({granted:false,instruction:'',at:''});
export function templates(projectId){return {
 'project.json':{schemaVersion:1,projectId,business:{name:'',locality:''},instructionCommit:'',assignment:'',scope:'first-site',builder:'',reviewer:'',outputDir:'site/dist',permissions:{build:grant(),publish:grant(),tracker:grant(),outreach:grant()}},
 'STATE.json':{schemaVersion:1,currentStage:'brief',completed:[],events:[]},
 'research.json':{schemaVersion:1,identity:{matched:false,reason:'',sourceIds:[]},sources:[],facts:[],baseline:{status:'unknown',pages:[],checkedUrls:[],limitations:''},differentiators:[],primaryJourney:'',launchUnknowns:[]},
 'assets.json':{schemaVersion:1,strategy:'',entries:[]},
 'design.json':{schemaVersion:1,concept:'',rationale:'',layoutSignature:'',typography:'',palette:[],mobileStrategy:'',distinctions:[],copy:{headline:'',body:'',primaryCta:''},comparison:'',conceptReviewedBy:''},
 'routes.json':{schemaVersion:1,pages:[]},
 'flows.json':{schemaVersion:1,entries:[]},
 'implementation.json':{schemaVersion:1,sourceDir:'site',buildCommand:'',buildStamp:'',allowlist:[],configOnly:[],flowTestFiles:[]},
 'qa.json':{schemaVersion:1,fingerprint:'0'.repeat(64),technical:emptyRef(),flows:[],defects:[]},
 'review.json':{schemaVersion:1,fingerprint:'0'.repeat(64),reviewedBy:'',coverage:[],scores:{specificity:0,artDirection:0,copyContent:0,mobile:0,journeys:0,finishAccessibility:0},comparison:'',observations:'',ownerInputs:[]},
 'publication.json':{schemaVersion:1,provider:'cloudflare-pages',projectName:'',deploymentId:'',status:'pending',deployedAt:'',buildStamp:'',stableUrl:'',immutableUrl:'',receipt:emptyRef(),hostedQa:emptyRef(),publicVerification:emptyRef()},
 'tracker.json':{schemaVersion:1,projectId,applied:false,writePlan:emptyRef(),before:emptyRef(),after:emptyRef(),preservationVerified:false,verifiedCells:[],tableCoverageVerified:false}
};}
