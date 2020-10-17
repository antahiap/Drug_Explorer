import React, { createContext, useContext, useReducer } from 'react';
import rootReducer from './reducer'
import {IDrugPredictions} from './DataService'



export interface IState {
    predictions: IDrugPredictions 
}




export type IAction = any 

const initialState: IState = {
  predictions: {
    drugIDs: [],
    drugNames: [],
    rankList: {},
    isPredictionLoaded: false
  },
  
}

interface IStateContext {
  state: IState;
  dispatch: ({type}:{type:string}) => void;
}

const GlobalStore = createContext({} as IStateContext);

// An wrapping function to handle thunks (dispatched actions which are wrapped in a function, needed for async callbacks)
const asyncer = (dispatch: any, state: IState) => (action: any) =>
    typeof(action) === 'function' ? action(dispatch, state) : dispatch(action);

 

// The StateProvider component to provide the global state to all child components
export function StateProvider(props: any) {
  const [state, dispatchBase] = React.useReducer(rootReducer, initialState);

  const dispatch = React.useCallback(asyncer(dispatchBase, state), [])

  return <GlobalStore.Provider value={{ state, dispatch }}>
          { props.children }
      </GlobalStore.Provider>
}
  
export function StateConsumer(Component: any) {
  return function WrapperComponent(props: any) {
      return (
          <GlobalStore.Consumer>
              {context => <Component {...props} globalState={context.state} dispatch={context.dispatch} />}
          </GlobalStore.Consumer>
      );
  }
}


export {ACTION_TYPES} from './reducer'
