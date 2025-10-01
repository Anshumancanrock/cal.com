# Focus Loss Debug Instructions

## What We've Done

We've added comprehensive logging to trace re-renders through the component tree:

1. **EventTeamAssignmentTab** (Parent) - Logs: `[EventTeamAssignmentTab] RENDER`
2. **RoundRobinSection** (Isolated Component) - Logs: `[RoundRobinSection] RENDER`  
3. **SegmentWithAttributes** (Filter Input) - Logs: `[SegmentWithAttributes] RENDER`

## How to Test

### 1. Start the development server:
```powershell
yarn dev
```

### 2. Navigate to the problematic page:
- Go to a **Team Event Type**
- Click on the **Assignment** tab
- Select **Round Robin** as scheduling type
- Scroll down to the **Attributes filter** section

### 3. Open browser DevTools console (F12)

### 4. Type in the attributes filter input

## What to Look For

### ✅ EXPECTED Behavior (Our fix is working):
When you type in the attributes filter, you should ONLY see:
```
[SegmentWithAttributes] RENDER
```

You should **NOT** see:
- `[EventTeamAssignmentTab] RENDER` 
- `[RoundRobinSection] RENDER`

**If EventTeamAssignmentTab or RoundRobinSection are logging, our isolation failed.**

### ❌ CURRENT Behavior (If still broken):
If you see ALL three logging on every keystroke:
```
[EventTeamAssignmentTab] RENDER - Parent component is re-rendering
[RoundRobinSection] RENDER - This should NOT log when typing in attributes filter
[SegmentWithAttributes] RENDER - Segment component is re-rendering
```

This means:
1. The parent is re-rendering (BAD - means there's a subscription somewhere)
2. RoundRobinSection is re-rendering (BAD - React.memo failed or props changed)
3. Segment is re-rendering (EXPECTED - it's the input component)

## Next Steps Based on Results

### If EventTeamAssignmentTab is logging:
**Problem**: Parent has a subscription to form state
**Solution**: Find and remove the subscription (useWatch, formState, etc.)

### If RoundRobinSection is logging (but EventTeamAssignmentTab is NOT):
**Problem**: React.memo is not working - props are changing
**Possible causes**:
- `eventType` prop is not stable (new object on each render)
- `handleMaxLeadThresholdChange` is not memoized properly  
- `t` function reference is changing

### If ONLY SegmentWithAttributes is logging:
**SUCCESS!** ✅ The focus loss is fixed!

## How to Share Results

After testing, please share:
1. What you see in the console when typing
2. Whether focus is maintained or lost
3. Any error messages in the console

This will help us identify the EXACT source of the re-render.
