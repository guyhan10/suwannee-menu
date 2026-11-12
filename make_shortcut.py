import plistlib, uuid
U=lambda: str(uuid.uuid4()).upper()
def att(uid,name): return {"Value":{"OutputUUID":uid,"Type":"ActionOutput","OutputName":name},"WFSerializationType":"WFTextTokenAttachment"}
def tok(ref): return {"Value":{"string":"￼","attachmentsByRange":{"{0, 1}":ref}},"WFSerializationType":"WFTextTokenString"}
def act(ident,params): return {"WFWorkflowActionIdentifier":ident,"WFWorkflowActionParameters":params}
acts=[]
def set_file(name):
    t=U()
    acts.append(act("is.workflow.actions.gettext",{"UUID":t,"WFTextActionText":name}))
    acts.append(act("is.workflow.actions.setvariable",{"WFVariableName":"file","WFInput":att(t,"Text")}))
A,H,M,C,X=U(),U(),U(),U(),U()
acts+= [act("is.workflow.actions.date",{"UUID":A,"WFDateActionMode":"Current Date"}),
        act("is.workflow.actions.properties.date",{"UUID":H,"WFContentItemPropertyName":"Hour","WFInput":att(A,"Date")}),
        act("is.workflow.actions.properties.date",{"UUID":M,"WFContentItemPropertyName":"Minute","WFInput":att(A,"Date")}),
        act("is.workflow.actions.math",{"UUID":X,"WFInput":att(H,"Hour"),"WFMathOperation":"×","WFMathOperand":60}),
        act("is.workflow.actions.math",{"UUID":C,"WFInput":att(X,"Calculation Result"),"WFMathOperation":"+",
            "WFMathOperand":att(M,"Minute")})]
branches=[("630","today-breakfast"),("990","today-lunch"),("1320","today-dinner")]
groups=[U() for _ in branches]
for (num,f),g in zip(branches,groups):
    acts.append(act("is.workflow.actions.conditional",{"GroupingIdentifier":g,"WFControlFlowMode":0,"WFCondition":0,"WFNumberValue":num,
        "WFInput":{"Type":"Variable","Variable":att(C,"Calculation Result")}}))
    set_file(f)
    acts.append(act("is.workflow.actions.conditional",{"GroupingIdentifier":g,"WFControlFlowMode":1}))
set_file("tomorrow-breakfast")
for g in reversed(groups):
    acts.append(act("is.workflow.actions.conditional",{"GroupingIdentifier":g,"WFControlFlowMode":2,"UUID":U()}))
base="https://raw.githubusercontent.com/guyhan10/suwannee-menu/main/menu/"
T,D=U(),U()
acts.append(act("is.workflow.actions.gettext",{"UUID":T,"WFTextActionText":{"Value":{"string":base+"￼.txt",
    "attachmentsByRange":{"{%d, 1}"%len(base):{"Type":"Variable","VariableName":"file"}}},"WFSerializationType":"WFTextTokenString"}}))
acts.append(act("is.workflow.actions.downloadurl",{"UUID":D,"WFURL":tok({"OutputUUID":T,"Type":"ActionOutput","OutputName":"Text"}),"WFHTTPMethod":"GET"}))
acts.append(act("is.workflow.actions.showresult",{"Text":tok({"OutputUUID":D,"Type":"ActionOutput","OutputName":"Contents of URL"})}))
wf={"WFWorkflowActions":acts,"WFWorkflowClientVersion":"2607.0.2","WFWorkflowMinimumClientVersion":900,"WFWorkflowMinimumClientVersionString":"900",
    "WFWorkflowIcon":{"WFWorkflowIconStartColor":4271458815,"WFWorkflowIconGlyphNumber":59511},
    "WFWorkflowImportQuestions":[],"WFWorkflowInputContentItemClasses":[],"WFWorkflowTypes":[],"WFWorkflowHasShortcutInputVariables":False,
    "WFWorkflowOutputContentItemClasses":[],"WFQuickActionSurfaces":[]}
open("/mnt/user-data/outputs/Suwannee4.shortcut","wb").write(plistlib.dumps(wf,fmt=plistlib.FMT_BINARY))
print(len(acts),"actions")
