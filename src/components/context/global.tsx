import { Container } from 'unstated'
import { _lang,_currentStore, _currentTheme, _isSingle, _goalBPI, _goalPercentage } from '../settings'

interface S{
  lang:string,
  store:string,
  theme:string,
  cannotMove:boolean,
  isSingle:number,
  goalBPI:number,
  goalPercentage:number,
}

export default class GlobalContainer extends Container<S> {

  constructor(){
    super();
    this.setLang = this.setLang.bind(this);
    this.setStore = this.setStore.bind(this);
    this.setTheme = this.setTheme.bind(this);
    this.setIsSingle = this.setIsSingle.bind(this);
    this.setGoalBPI = this.setGoalBPI.bind(this);
    this.setGoalPercentage = this.setGoalPercentage.bind(this);
  }

  state = {
    lang : _lang(),
    store : _currentStore(),
    theme : _currentTheme(),
    isSingle : _isSingle(),
    goalBPI : _goalBPI(),
    goalPercentage : _goalPercentage(),
    cannotMove: false
  }

  setLang(newLang:string) {
    localStorage.setItem("lang",newLang);
    this.setState({ lang: newLang })
  }

  setStore(newStore:string){
    localStorage.setItem("currentStore",newStore);
    this.setState({ store: newStore });
  }

  setTheme(newTheme:string){
    localStorage.setItem("theme",newTheme);
    this.setState({ theme: newTheme });
  }

  setIsSingle(newState:number){
    localStorage.setItem("isSingle",String(newState));
    this.setState({ isSingle: newState });
  }

  setGoalBPI(newState:number){
    localStorage.setItem("goalBPI",String(newState));
    this.setState({ goalBPI: newState });
  }

  setGoalPercentage(newState:number){
    localStorage.setItem("goalPercentage",String(newState));
    this.setState({ goalPercentage: newState });
  }

  setMove(newState:boolean) {
    this.setState({ cannotMove: newState })
  }

}
