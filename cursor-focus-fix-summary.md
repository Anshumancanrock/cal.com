# Round Robin Assignment Attributes Filter - Cursor Focus Fix

## Problem Analysis

The issue was that the cursor was losing focus on every keystroke in the attributes filter for Round Robin assignment. This was happening due to:

1. **Component Re-rendering**: Every keystroke triggered state updates that caused the entire React Awesome Query Builder (RAQB) component tree to re-render
2. **Unstable Component References**: The `renderBuilder` function and `onChange` handlers were being recreated on every render
3. **Missing React Keys**: Components lacked stable keys, causing React to remount instead of updating in place
4. **Inefficient State Management**: Configuration objects were being recreated unnecessarily

## Root Cause

The main issue was in `/packages/features/Segment.tsx`:
- `renderBuilder` callback had no dependencies but was still causing re-renders
- `onChange` function was not memoized, causing unnecessary re-creations
- Query builder configuration was being recreated on every render
- No stable keys on critical components

## Solution Implemented

### 1. Optimized Segment Component (`/packages/features/Segment.tsx`)

**Changes Made:**
- Added `useMemo` import for memoization
- Memoized `attributesQueryBuilderConfig` to prevent recreation
- Memoized `attributesQueryBuilderConfigWithRaqbSettingsAndWidgets`
- Memoized `queryBuilderData` to prevent recalculation
- Added `useCallback` to `onChange` handler with proper dependencies
- Added stable `key` props to critical components:
  - `Query` component: `key="attributes-query-builder"`
  - Container divs with meaningful keys
  - `Builder` component: `key="raqb-builder"`

### 2. Optimized Widget Components (`/packages/app-store/routing-forms/components/react-awesome-query-builder/widgets.tsx`)

**Changes Made:**
- Added `useCallback` import
- Memoized `onChange` handlers in:
  - `TextWidget`: `useCallback((e) => setValue(e.target.value), [setValue])`
  - `TextAreaWidget`: `useCallback((e) => setValue(e.target.value), [setValue])`
  - `NumberWidget`: `useCallback((e) => setValue(e.target.value), [setValue])`

### 3. Optimized Factory Functions (`/packages/app-store/routing-forms/components/react-awesome-query-builder/config/uiConfig.tsx`)

**Changes Made:**
- Added `useCallback` import
- Optimized `EmailFactory` with memoized change handler:
  ```tsx
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    props.setValue(val);
  }, [props.setValue]);
  ```

## Technical Details

### Performance Optimizations:

1. **Memoization Strategy**: 
   - Configuration objects are now memoized and only recreate when dependencies change
   - Event handlers are memoized to prevent function recreation on every render

2. **React Reconciliation**:
   - Added stable keys to help React properly identify components during re-renders
   - Prevents unnecessary component unmounting/remounting

3. **State Update Optimization**:
   - `onChange` callback properly manages dependencies to prevent excessive updates
   - `isEqual` check still prevents infinite re-renders from RAQB

### Key Files Modified:

1. `/packages/features/Segment.tsx` - Main optimization
2. `/packages/app-store/routing-forms/components/react-awesome-query-builder/widgets.tsx` - Widget optimizations  
3. `/packages/app-store/routing-forms/components/react-awesome-query-builder/config/uiConfig.tsx` - Factory optimizations

## Expected Behavior After Fix

✅ **Cursor should maintain focus** while typing in attribute filter text inputs
✅ **No input interruption** on keystroke
✅ **Smooth typing experience** without cursor jumping
✅ **All existing functionality preserved**
✅ **Performance improved** due to reduced re-renders

## Testing Instructions

To test the fix:

1. Log in to Organization account
2. Create Round Robin event 
3. Go to assignment tab
4. Add attributes filter
5. Type continuously in text input fields
6. Verify cursor stays focused and doesn't lose position

## Compatibility

- ✅ Follows existing codebase patterns
- ✅ Uses established React hooks patterns
- ✅ Maintains backward compatibility
- ✅ No breaking changes
- ✅ Consistent with Cal.com's code style

## Files Changed Summary

- `packages/features/Segment.tsx` - Core fix for state management and memoization
- `packages/app-store/routing-forms/components/react-awesome-query-builder/widgets.tsx` - Widget optimization
- `packages/app-store/routing-forms/components/react-awesome-query-builder/config/uiConfig.tsx` - Factory optimization

This fix addresses the cursor focus issue while maintaining code quality and following React best practices.