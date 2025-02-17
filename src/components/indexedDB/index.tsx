import Dexie from "dexie";
import {scoreData,songData, rivalScoreData, DBRivalStoreData, historyData} from "../../types/data";
import timeFormatter, { timeCompare } from "../common/timeFormatter";
import {_currentStore,_isSingle} from "../settings";
import {difficultyDiscriminator, difficultyParser, diffsUpperCase} from "../songs/filter";
import bpiCalcuator, { B } from "../bpi";
import {noimg, alternativeImg} from "../common/"
import { DBLists } from "../../types/lists";

const storageWrapper = class extends Dexie{
  target: string = "scores";
  //あとで書いとく
  protected scores:Dexie.Table<scoreData, string|number|(string|number)[]>;
  protected songs:Dexie.Table<songData, number>;
  protected scoreHistory: Dexie.Table<historyData, number>;
  protected rivals:Dexie.Table<rivalScoreData, string|number|(string|number)[]>;
  protected rivalLists: Dexie.Table<DBRivalStoreData, string>;
  protected favLists: Dexie.Table<any, string>;
  protected favSongs: Dexie.Table<any, string>;
  protected calculator:bpiCalcuator|null = null;

  constructor(){
    super("ScoreCoach");
    this.close();
    this.version(1).stores({
      scores : "[title+difficulty+storedAt+isSingle],title,*difficulty,*difficultyLevel,*version,currentBPI,exScore,Pgreat,great,missCount,clearState,lastPlayed,storedAt,isSingle,isImported,updatedAt,lastScore",
      songs : "&++num,title,*difficulty,*difficultyLevel,wr,avg,notes,bpm,textage,dpLevel,isCreated,isFavorited,[title+difficulty]",
      stores : "&name,updatedAt",
      scoreHistory : "&++num,[title+storedAt+difficulty+isSingle],[title+storedAt+difficulty+isSingle+updatedAt],title,difficulty,difficultyLevel,storedAt,exScore,BPI,isSingle,updatedAt"
    });
    this.version(2).stores({
      scores : "[title+difficulty+storedAt+isSingle],title,*difficulty,*difficultyLevel,*version,currentBPI,exScore,Pgreat,great,missCount,clearState,lastPlayed,storedAt,isSingle,isImported,updatedAt,lastScore",
      songs : "&++num,title,*difficulty,*difficultyLevel,wr,avg,notes,bpm,textage,dpLevel,isCreated,isFavorited,coef,[title+difficulty]",
      scoreHistory : "&++num,[title+storedAt+difficulty+isSingle],[title+storedAt+difficulty+isSingle+updatedAt],title,difficulty,difficultyLevel,storedAt,exScore,BPI,isSingle,updatedAt"
    });
    this.version(3).stores({
      scores : "[title+difficulty+storedAt+isSingle],title,*difficulty,*difficultyLevel,*version,currentBPI,exScore,missCount,clearState,lastPlayed,storedAt,isSingle,isImported,updatedAt,lastScore",
      songs : "&++num,title,*difficulty,*difficultyLevel,wr,avg,notes,bpm,textage,dpLevel,isCreated,isFavorited,[title+difficulty]",
      rivals : "&[title+difficulty+storedAt+isSingle+rivalName],rivalName,title,*difficulty,*difficultyLevel,exScore,missCount,clearState,storedAt,isSingle,updatedAt",
      rivalLists : "&uid,rivalName,lastUpdatedAt,updatedAt,[isSingle+storedAt],photoURL,profile",
      scoreHistory : "&++num,[title+storedAt+difficulty+isSingle],[title+storedAt+difficulty+isSingle+updatedAt],title,difficulty,difficultyLevel,storedAt,exScore,BPI,isSingle,updatedAt"
    }).upgrade(_tx => {
      return this.scores.toCollection().modify((item:any)=>{
        delete item.Pgreat;
        delete item.great;
      });
    });
    this.version(4).stores({
      scores : "[title+difficulty+storedAt+isSingle],title,*difficulty,*difficultyLevel,*version,currentBPI,exScore,missCount,clearState,lastPlayed,storedAt,isSingle,updatedAt,lastScore",
      songs : "&++num,title,*difficulty,*difficultyLevel,wr,avg,notes,bpm,textage,dpLevel,isCreated,isFavorited,[title+difficulty]",
      rivals : "&[title+difficulty+storedAt+isSingle+rivalName],rivalName,title,*difficulty,*difficultyLevel,exScore,missCount,clearState,storedAt,isSingle,updatedAt",
      rivalLists : "&uid,rivalName,lastUpdatedAt,updatedAt,[isSingle+storedAt],photoURL,profile",
      scoreHistory : "&++num,[title+storedAt+difficulty+isSingle],[title+storedAt+difficulty+isSingle+updatedAt],title,difficulty,difficultyLevel,storedAt,exScore,BPI,isSingle,updatedAt"
    }).upgrade(_tx => {
      return this.scores.toCollection().modify((item:any)=>{
        delete item.isImported;
      });
    });
    this.version(5).stores({
      scores : "[title+difficulty+storedAt+isSingle],title,*difficulty,*difficultyLevel,currentBPI,exScore,missCount,clearState,lastPlayed,storedAt,isSingle,updatedAt,lastScore",
      songs : "&++num,title,*difficulty,*difficultyLevel,wr,avg,notes,bpm,textage,dpLevel,isCreated,isFavorited,[title+difficulty]",
      rivals : "&[title+difficulty+storedAt+isSingle+rivalName],rivalName,title,*difficulty,*difficultyLevel,exScore,missCount,clearState,storedAt,isSingle,updatedAt",
      rivalLists : "&uid,rivalName,lastUpdatedAt,updatedAt,[isSingle+storedAt],photoURL,profile",
      scoreHistory : "&++num,[title+storedAt+difficulty+isSingle],[title+storedAt+difficulty+isSingle+updatedAt],title,difficulty,difficultyLevel,storedAt,exScore,BPI,isSingle,updatedAt"
    }).upgrade(_tx => {
      return this.scores.toCollection().modify((item:any)=>{
        delete item.version;
      });
    });
    this.version(6).stores({
      scores : "[title+difficulty+storedAt+isSingle],title,*difficulty,*difficultyLevel,currentBPI,exScore,missCount,clearState,storedAt,isSingle,updatedAt,lastScore",
      songs : "&++num,title,*difficulty,*difficultyLevel,wr,avg,notes,bpm,textage,dpLevel,isCreated,isFavorited,[title+difficulty]",
      rivals : "&[title+difficulty+storedAt+isSingle+rivalName],rivalName,title,*difficulty,*difficultyLevel,exScore,missCount,clearState,storedAt,isSingle,updatedAt",
      rivalLists : "&uid,rivalName,lastUpdatedAt,updatedAt,[isSingle+storedAt],photoURL,profile",
      scoreHistory : "&++num,[title+storedAt+difficulty+isSingle],[title+storedAt+difficulty+isSingle+updatedAt],title,difficulty,difficultyLevel,storedAt,exScore,BPI,isSingle,updatedAt"
    }).upgrade(_tx => {
      return this.scores.toCollection().modify((item:any)=>{
        delete item.lastPlayed;
      });
    });
    this.version(8).stores({
      scores : "[title+difficulty+storedAt+isSingle],title,*difficulty,*difficultyLevel,currentBPI,exScore,missCount,clearState,storedAt,isSingle,updatedAt,lastScore",
      songs : "&++num,title,*difficulty,*difficultyLevel,wr,avg,notes,bpm,textage,dpLevel,[title+difficulty]",
      rivals : "&[title+difficulty+storedAt+isSingle+rivalName],rivalName,title,*difficulty,*difficultyLevel,exScore,missCount,clearState,storedAt,isSingle,updatedAt",
      rivalLists : "&uid,rivalName,lastUpdatedAt,updatedAt,[isSingle+storedAt],photoURL,profile",
      scoreHistory : "&++num,[title+storedAt+difficulty+isSingle],[title+storedAt+difficulty+isSingle+updatedAt],title,difficulty,difficultyLevel,storedAt,exScore,BPI,isSingle,updatedAt",
      favLists : "&num,title,length,description,updatedAt",
      favSongs : "&[title+difficulty+listedOn],[title+difficulty],listedOn",
    }).upgrade(async(_tx) => {
      const songs = (await this.songs.toArray()).filter((item)=>item.isFavorited === true);
      this.favLists.add({
        "title":"お気に入り",
        "description":"デフォルトのリスト",
        "length":songs.length,
        "num":0,
        "updatedAt":timeFormatter(3),
      });
      for(let i = 0;i < songs.length; ++i){
        const song = songs[i];
        this.favSongs.add({
          "title":song.title,
          "difficulty":song.difficulty,
          "listedOn":0
        });
      }
      this.songs.toCollection().modify((item:any)=>{
        delete item.isCreated;
        delete item.isFavorited;
      });
    });
    this.version(9).stores({
      scores : "[title+difficulty+storedAt+isSingle],title,*difficulty,*difficultyLevel,currentBPI,exScore,missCount,clearState,storedAt,isSingle,updatedAt,lastScore",
      songs : "&++num,title,*difficulty,*difficultyLevel,wr,avg,notes,bpm,textage,dpLevel,memo,[title+difficulty]",
      rivals : "&[title+difficulty+storedAt+isSingle+rivalName],rivalName,title,*difficulty,*difficultyLevel,exScore,missCount,clearState,storedAt,isSingle,updatedAt",
      rivalLists : "&uid,rivalName,lastUpdatedAt,updatedAt,[isSingle+storedAt],photoURL,profile",
      scoreHistory : "&++num,[title+storedAt+difficulty+isSingle],[title+storedAt+difficulty+isSingle+updatedAt],title,difficulty,difficultyLevel,storedAt,exScore,BPI,isSingle,updatedAt",
      favLists : "&num,title,length,description,updatedAt",
      favSongs : "&[title+difficulty+listedOn],[title+difficulty],listedOn",
    });
    this.version(10).stores({
      scores : "[title+difficulty+storedAt+isSingle],title,*difficulty,*difficultyLevel,currentBPI,exScore,missCount,clearState,storedAt,isSingle,updatedAt,lastScore",
      songs : "&++num,title,*difficulty,*difficultyLevel,wr,avg,notes,bpm,textage,dpLevel,memo,[title+difficulty]",
      rivals : "&[title+difficulty+storedAt+isSingle+rivalName],rivalName,title,*difficulty,*difficultyLevel,exScore,missCount,clearState,storedAt,isSingle,updatedAt",
      rivalLists : "&uid,rivalName,lastUpdatedAt,updatedAt,[isSingle+storedAt],photoURL,profile",
      scoreHistory : "&++num,[title+storedAt+difficulty+isSingle],[title+storedAt+difficulty+isSingle+updatedAt],title,difficulty,difficultyLevel,storedAt,exScore,BPI,isSingle,updatedAt",
      favLists : "&num,title,length,description,icon,updatedAt",
      favSongs : "&[title+difficulty+listedOn],[title+difficulty],listedOn",
    }).upgrade(async(_tx) => {
      this.favLists.toCollection().modify((item:any)=>{
        item.icon = alternativeImg(item.title);
      });
    });
    this.version(11).stores({
      scores : "[title+difficulty+storedAt+isSingle],title,*difficulty,*difficultyLevel,currentBPI,exScore,missCount,clearState,storedAt,isSingle,updatedAt,lastScore",
      songs : "&++num,title,*difficulty,*difficultyLevel,wr,avg,notes,bpm,textage,dpLevel,memo,[title+difficulty]",
      rivals : "&[title+difficulty+storedAt+isSingle+rivalName],rivalName,title,*difficulty,*difficultyLevel,exScore,missCount,clearState,storedAt,isSingle,updatedAt",
      rivalLists : "&uid,rivalName,lastUpdatedAt,updatedAt,[isSingle+storedAt],photoURL,profile,socialId",
      scoreHistory : "&++num,[title+storedAt+difficulty+isSingle],[title+storedAt+difficulty+isSingle+updatedAt],title,difficulty,difficultyLevel,storedAt,exScore,BPI,isSingle,updatedAt",
      favLists : "&num,title,length,description,icon,updatedAt",
      favSongs : "&[title+difficulty+listedOn],[title+difficulty],listedOn",
    });
    // dummy update
    this.version(20).stores({
      scores : "[title+difficulty+storedAt+isSingle],title,*difficulty,*difficultyLevel,currentBPI,exScore,missCount,clearState,storedAt,isSingle,updatedAt,lastScore",
      songs : "&++num,title,*difficulty,*difficultyLevel,wr,avg,notes,bpm,textage,dpLevel,memo,[title+difficulty]",
      rivals : "&[title+difficulty+storedAt+isSingle+rivalName],rivalName,title,*difficulty,*difficultyLevel,exScore,missCount,clearState,storedAt,isSingle,updatedAt",
      rivalLists : "&uid,rivalName,lastUpdatedAt,updatedAt,[isSingle+storedAt],photoURL,profile,socialId",
      scoreHistory : "&++num,[title+storedAt+difficulty+isSingle],[title+storedAt+difficulty+isSingle+updatedAt],title,difficulty,difficultyLevel,storedAt,exScore,BPI,isSingle,updatedAt",
      favLists : "&num,title,length,description,icon,updatedAt",
      favSongs : "&[title+difficulty+listedOn],[title+difficulty],listedOn",
    });
    this.scores = this.table("scores");
    this.scoreHistory = this.table("scoreHistory");
    this.songs = this.table("songs");
    this.rivals = this.table("rivals");
    this.rivalLists = this.table("rivalLists");
    this.favLists = this.table("favLists");
    this.favSongs = this.table("favSongs");
    this.open();
  }

  protected newSongs:{[key:string]:songData} = {};

  setNewSongsDBRawData(reduced:{[key:string]:songData}):this{
    this.newSongs = reduced;
    return this;
  }

  protected setCalcClass(){
    this.calculator = new bpiCalcuator();
    return this;
  }

  protected apply(t:songData,s:number,i:number = 1):number{
    if(!this.calculator){
      return 0;
    }
    return this.calculator.setPropData(t,s,i);
  }

}

export const favsDB = class extends storageWrapper{

  async getAllLists():Promise<DBLists[]>{
    try{
      return await this.favLists.toArray();
    }catch(e:any){
      console.error(e);
      return [];
    }
  }

  async getListFromNum(num:number):Promise<DBLists|null>{
    try{
      const t = await this.favLists.where({num:num}).toArray();
      if(t.length > 0){
        return t[0];
      }else{
        return null;
      }
    }catch(e:any){
      console.error(e);
      return null;
    }
  }

  async addList(title:string = "new list",description:string = "",icon:string = ""){
    try{
      return this.favLists.add({
        "num":new Date().getTime(),
        "title":title,
        "description":description,
        "icon":icon || alternativeImg(title),
        "length":0,
        "updatedAt":timeFormatter(3),
      });
    }catch(e:any){
      console.log(e);
      return "";
    }
  }

  async editList(target:number,title:string = "new list",description:string = "",icon:string = ""){
    try{
      return this.favLists.where({num:target}).modify({
        "title":title,
        "description":description,
        "icon":icon || alternativeImg(title),
        "updatedAt":timeFormatter(3),
      });
    }catch(e:any){
      console.log(e);
      return "";
    }
  }

  async setListLength(targetNum:number,willInc:boolean){
    try{
      const len = await this.getListLen(targetNum);
      if(len === -1){
        throw new Error();
      }
      await this.favLists.where("num").equals(targetNum).modify({
        "length":willInc ? len + 1 : len - 1,
        "updatedAt":timeFormatter(3),
      });
      return true;
    }catch(e:any){
      console.log(e);
      return false;
    }
  }

  async getListsFromSong(title:string,difficulty:string){
    try{
      return this.favSongs.where("[title+difficulty]").equals([title,difficulty]).toArray();
    }catch(e:any){
      return [];
    }
  }

  async removeList(target:number){
    try{
      await this.favLists.where({num:target}).delete();
      await this.favSongs.where("listedOn").equals(target).delete();
    }catch(e:any){
      return;
    }
  }

  async getListNumber(title:string):Promise<number>{
    try{
      const list = (await this.favLists.where("title").equals(title).toArray());
      if(list.length > 0){
        return list[0].num
      }else{
        throw new Error()
      }
    }catch(e:any){
      return -1;
    }
  }

  async getListLen(targetNum:number):Promise<number>{
    try{
      const list = (await this.favLists.where("num").equals(targetNum).toArray());
      if(list.length > 0){
        return list[0].length
      }else{
        throw new Error()
      }
    }catch(e:any){
      return -1;
    }
  }

  async getListSum():Promise<number>{
    try{
      return (await this.favLists.toArray()).length;
    }catch(e:any){
      return -1;
    }
  }

  async getAllItemsInAList(num:number):Promise<any[]>{
    try{
      return await this.favSongs.where({listedOn:num}).toArray();
    }catch(e:any){
      return [];
    }
  }

  async addItemToList(title:string,difficulty:string,target:number){
    try{
      return this.favSongs.add({
        "title":title,
        "difficulty":difficulty,
        "listedOn":target,
      });
    }catch(e:any){
      console.log(e);
      return;
    }
  }

  async removeItemFromList(title:string,difficulty:string,target:number){
    try{
      return this.favSongs.where({
        "title":title,
        "difficulty":difficulty,
        "listedOn":target,
      }).delete();
    }catch(e:any){
      console.log(e);
      return;
    }
  }

}

export const scoresDB = class extends storageWrapper{
  scores: Dexie.Table<any, any>;
  storedAt:string = "";
  isSingle:number = 1;
  currentData:scoreData[] = [];

  constructor(isSingle:number = 1,storedAt?:string){
    super();
    this.scores = this.table("scores");
    this.isSingle = isSingle;
    if(storedAt){
      this.storedAt = storedAt;
    }else{
      this.storedAt = _currentStore();
    }
  }

  setIsSingle(isSingle:number):this{
    this.isSingle = isSingle;
    return this;
  }

  setStoredAt(storedAt:string):this{
    this.storedAt = storedAt;
    return this;
  }

  async getAll():Promise<scoreData[]>{
    try{
      const currentData = await this.scores.where({
        storedAt:_currentStore(),
        isSingle:_isSingle(),
      }).toArray();
      return currentData;
    }catch(e:any){
      console.error(e);
      return [];
    }
  }

  async getAllVersions():Promise<scoreData[]>{
    try{
      const currentData = await this.scores.where({
        isSingle:_isSingle(),
      }).toArray();
      return currentData;
    }catch(e:any){
      console.error(e);
      return [];
    }
  }

  async loadStore():Promise<this>{
    try{
      this.currentData = await this.scores.where({
        storedAt:this.storedAt,
        isSingle:_isSingle(),
      }).toArray();
      return this;
    }catch(e:any){
      console.error(e);
      return this;
    }
  }

  async getSpecificVersionAll():Promise<scoreData[]>{
    try{
      const currentData = await this.scores.where({
        storedAt:this.storedAt,
        isSingle:this.isSingle,
      }).toArray();
      return currentData;
    }catch(e:any){
      console.error(e);
      return [];
    }
  }

  async deleteAll():Promise<void>{
    return await this.scores.clear();
  }

  getItem(title:string,difficulty:string,storedAt:string,isSingle:number):Promise<scoreData[]>{
    return this.scores.where("[title+difficulty+storedAt+isSingle]").equals([title,difficulty,storedAt,isSingle]).toArray();
  }

  //for statistics
  async getItemsBySongDifficulty(diff:string = "12"):Promise<scoreData[]>{
    try{
      if(!this.currentData){await this.loadStore();}
      return this.currentData.filter(item=>item.difficultyLevel === diff);
    }catch(e:any){
      console.error(e);
      return [];
    }
  }

  async getItemsBySongDifficultyWithSpecificVersion(diff:string = "12",store:string):Promise<any>{
    try{
      return await this.scores.where({
        storedAt:store,
        isSingle:_isSingle(),
      }).toArray().then(t=>t.filter(item=>item.difficultyLevel === diff).reduce((group,item)=>{
        group[item.title + item.difficulty] = item.currentBPI;
        return group;
      },{}));
    }catch(e:any){
      console.error(e);
      return [];
    }
  }

  async resetItems(storedAt:string):Promise<number>{
    return await this.scores.where({storedAt:storedAt}).delete();
  }

  async removeNaNItems():Promise<number>{
    return await this.scores.where({storedAt:_currentStore(),currentBPI:NaN}).delete();
  }

  async setItem(item:any):Promise<any>{
    try{
      return await this.scores.where("[title+difficulty+storedAt+isSingle]").equals(
        [item["title"],item["difficulty"],this.storedAt,this.isSingle]
      ).modify({
        title:item["title"],
        difficulty:item["difficulty"],
        difficultyLevel:item["difficultyLevel"],
        currentBPI:item["currentBPI"],
        exScore:Number(item["exScore"]),
        missCount:Number(item["missCount"]),
        clearState:item["clearState"],
        lastScore:item["lastScore"],
        storedAt:item["storedAt"],
        isSingle:item["isSingle"],
        updatedAt : item["updatedAt"]
      })
    }catch(e:any){
      console.error(e);
      return;
    }
  }

  putItem(item:any):any{
    try{
      return this.scores.put({
        title:item["title"],
        difficulty:item["difficulty"],
        difficultyLevel:item["difficultyLevel"],
        currentBPI:item["currentBPI"],
        exScore:Number(item["exScore"]),
        missCount:Number(item["missCount"]),
        clearState:item["clearState"],
        lastScore:item["lastScore"],
        storedAt:item["storedAt"],
        isSingle:item["isSingle"],
        updatedAt : item["updatedAt"]
      })
    }catch(e:any){
      console.error(e);
    }
  }

  async updateScore(score:scoreData|null,data:{currentBPI?:number,exScore?:number,clearState?:number,missCount?:number}):Promise<boolean>{
    try{
      if(!score){return false;}
      if(score.updatedAt === "-"){
        //put
        let newScoreData:scoreData = score;
        newScoreData.currentBPI = data.currentBPI || -15;
        newScoreData.exScore = data.exScore || 0;
        newScoreData.updatedAt = timeFormatter(0);
        await this.scores.add(newScoreData);
      }else{
        //update
        if(Number.isNaN(data.currentBPI)) delete data.currentBPI;
        if(Number.isNaN(data.exScore)) delete data.exScore;
        if(data.clearState === -1 || data.clearState === score.clearState) delete data.clearState;
        if(data.missCount === -1 || data.missCount === score.missCount) delete data.missCount;

        const newData = Object.assign(data,{
          updatedAt : timeFormatter(0),
          lastScore: score.exScore,
        });

        await this.scores.where("[title+difficulty+storedAt+isSingle]").equals([score.title,score.difficulty,score.storedAt,score.isSingle]).modify(newData);
      }
      return true;
    }catch(e:any){
      console.error(e);
      return false;
    }
  }

  async removeItem(title:string,storedAt:string):Promise<number>{
    return await this.scores.where({title:title,storedAt:storedAt}).delete();
  }

  async removeSpecificItemAtAllStores(title:string,diff?:string):Promise<number>{
    if(diff){
      return await this.scores.where({title:title,difficulty:difficultyDiscriminator(diff)}).delete();
    }
    return await this.scores.where({title:title}).delete();
  }

  getSpecificSong = (songTitle:string)=>this.scores.where("title").equals(songTitle).toArray();

  _getSpecificSong = async(songTitle:string,diff:string,isSingle:number)=> (
    await this.scores.where({title:songTitle,isSingle:isSingle}).toArray()
  ).filter(item=>item.difficulty === diff);

  modifyBPI = (t:songData,currentBPI:B)=> this.scores.where("[title+difficulty+storedAt+isSingle]").equals([t.title,t.difficulty,t.storedAt,t.isSingle]).modify(
    {currentBPI:!currentBPI.error ? currentBPI.bpi : -15}
  );

  async recalculateBPI(updatedSongs:string[] = []){
    try{
      const self = this;
      this.setCalcClass();
      const array = await this.scores.where("title").notEqual("").toArray();
      for(let i =0; i < array.length; ++i){
        const t = array[i];
        if(!self.calculator){return;}
        if(updatedSongs.length > 0 && updatedSongs.indexOf(t["title"] + difficultyParser(t["difficulty"],Number(t["isSingle"])) + t["isSingle"]) === -1){
          continue;
        }
        const bpi = await self.calculator.setIsSingle(t.isSingle).calc(t.title,difficultyParser(t.difficulty,t.isSingle),t.exScore);
        this.modifyBPI(t,bpi);
      }
    }catch(e:any){
      console.log(e);
    }
  }

  //置き換え予定
  async setDataWithTransaction(scores:scoreData[]){
    await this.transaction("rw",this.scores,async()=>{
      await this.scores.where({storedAt:_currentStore(),isSingle:_isSingle()}).delete();
      return Promise.all(scores.map(item=>this.putItem(item)));
    }).catch(e=>{
      console.log(e)
    });
    return null;
  }

}

export const scoreHistoryDB = class extends storageWrapper{
  isSingle:number = 1;
  currentStore:string = "27";

  constructor(){
    super();
    this.isSingle = _isSingle();
    this.currentStore = _currentStore();
  }

  setStore = (store:string)=> {
    this.currentStore = store;
    return this;
  }

  //newer method
  _add(score:scoreData|null,forceUpdateTime:boolean = false):boolean{
    try{
      if(!score){return false;}
      this.scoreHistory.add({
        title:score.title,
        exScore:score.exScore,
        difficulty:score.difficulty,
        difficultyLevel:score.difficultyLevel,
        storedAt:score.storedAt,
        BPI:score.currentBPI,
        updatedAt: forceUpdateTime ? score.updatedAt : timeFormatter(3),
        isSingle:score.isSingle,
      });
      return true;
    }catch(e:any){
      console.error(e);
      return false;
    }
  }

  //legacy
  add(score:scoreData|null,data:{currentBPI:number,exScore:number},forceUpdateTime:boolean = false):boolean{
    try{
      if(!score){return false;}
      this.scoreHistory.add({
        title:score.title,
        exScore:data.exScore,
        difficulty:score.difficulty,
        difficultyLevel:score.difficultyLevel,
        storedAt:score.storedAt,
        BPI:data.currentBPI,
        updatedAt: forceUpdateTime ? score.updatedAt : timeFormatter(3),
        isSingle:score.isSingle,
      });
      return true;
    }catch(e:any){
      console.error(e);
      return false;
    }
  }

  async removeNaNItems():Promise<number>{
    return await this.scoreHistory.where({storedAt:_currentStore(),BPI:NaN}).delete();
  }

  async removeSpecificItemAtAllStores(title:string,diff?:string):Promise<number>{
    if(diff){
      return await this.scores.where({title:title,difficulty:difficultyDiscriminator(diff)}).delete();
    }
    return await this.scoreHistory.where({title:title}).delete();
  }

  async check(item:scoreData):Promise<{willUpdate:boolean,lastScore:number}>{
    try{
      const t = await this.scoreHistory.where("[title+storedAt+difficulty+isSingle]").equals(
        [item["title"],item["storedAt"],item["difficulty"],item["isSingle"]]
      ).toArray().then((t)=>t.sort((a,b)=>timeCompare(b.updatedAt,a.updatedAt)));
      return {
        willUpdate:t.length === 0 ? true : Number(item.exScore) > Number(t[t.length - 1].exScore),
        lastScore:t.length === 0 ? -1 : t[t.length-1].exScore
      };
    }catch(e:any){
      return {
        willUpdate:false,
        lastScore:0,
      };
    }
  }

  async getAll(diff:string = "12"):Promise<historyData[]>{
    try{
      return await this.scoreHistory.where(
        {storedAt:this.currentStore,isSingle:this.isSingle,difficultyLevel:diff}
      ).toArray();
    }catch(e:any){
      console.error(e);
      return [];
    }
  }

  async getAllInSpecificVersion():Promise<any[]>{
    try{
      return await this.scoreHistory.where(
        {storedAt:this.currentStore,isSingle:this.isSingle}
      ).toArray();
    }catch(e:any){
      console.error(e);
      return [];
    }
  }

  async reset(storedAt?:string):Promise<any>{
    try{
      return await this.scoreHistory.where(
        {storedAt:storedAt ? storedAt : this.currentStore,isSingle:this.isSingle}
      ).delete();
    }catch(e:any){
      console.error(e);
      return 0;
    }
  }

  async getWithinVersion(song:songData):Promise<any[]>{
    try{
      if(!song){return [];}
      return await this.scoreHistory.where(
        {storedAt:this.currentStore,isSingle:this.isSingle,title:song.title,difficulty:difficultyDiscriminator(song.difficulty)}
      ).toArray().then(t=>t.sort((a,b)=>{
        return timeCompare(b.updatedAt,a.updatedAt)
      }));
    }catch(e:any){
      console.error(e);
      return [];
    }
  }

  async _getWithinVersion(title:string,diff:string):Promise<any[]>{
    try{
      return await this.scoreHistory.where(
        {storedAt:this.currentStore,isSingle:this.isSingle,title:title,difficulty:diff}
      ).toArray().then(t=>t.sort((a,b)=>{
        return timeCompare(b.updatedAt,a.updatedAt)
      }));
    }catch(e:any){
      console.error(e);
      return [];
    }
  }

  async getAcrossVersion(song:songData):Promise<any[]>{
    try{
      if(!song){return [];}
      const all = await this.scoreHistory.where(
        {isSingle:this.isSingle,title:song.title,difficulty:difficultyDiscriminator(song.difficulty)}
      ).toArray().then(t=>t.reduce((result:{[key:string]:historyData[]}, current) => {
        if(!result[current.storedAt]){
          result[current.storedAt] = [];
        }
        result[current.storedAt].push(current);
        return result;
      }, {}));
      let res:any[] = [];
      Object.keys(all).map((item:string)=>{
        const t = all[item].sort((a:any,b:any)=>{
          return b.exScore - a.exScore
        });
        res.push(t[0]);
        return 0;
      });
      return res.reverse();
    }catch(e:any){
      console.error(e);
      return [];
    }
  }

  async getRekidaiData(title:string,diff:diffsUpperCase):Promise<any>{
    const d = difficultyDiscriminator(diff);
    const m:songData = {
      title:title,
      difficulty:d,
      difficultyLevel:"12",
      wr:-1,avg:-1,notes:-1,bpm:"0",textage:"",dpLevel:"0",updatedAt:""
    };
    return await this.getAcrossVersion(m);
  }

  getSpecificSong = (songTitle:string)=>this.scoreHistory.where("title").equals(songTitle).toArray();
  modifyBPI = (t:historyData,currentBPI:B)=> this.scoreHistory.where("num").equals([t.title,t.difficulty,t.storedAt,t.isSingle]).modify(
    {currentBPI:!currentBPI.error ? currentBPI.bpi : -15}
  );

  async recalculateBPI(updatedSongs:string[] = []){
    try{
      const self = this;
      this.setCalcClass();
      const array = await this.scoreHistory.where("title").notEqual("").toArray();
      //modify使って書き直したい
      for(let i =0; i < array.length; ++i){
        const t = array[i];
        if(!self.calculator){return;}
        if(updatedSongs.length > 0 && updatedSongs.indexOf(t["title"] + difficultyParser(t["difficulty"],Number(t["isSingle"])) + t["isSingle"]) === -1){
          continue;
        }
        const bpi = await self.calculator.setIsSingle(t.isSingle).calc(t.title,difficultyParser(t.difficulty,t.isSingle),t.exScore);
        this.modifyBPI(t,bpi);
      }
    }catch(e:any){
      console.log(e);
      console.log("failed recalculate [scoreHistoryDB] - ");
      return;
    }
  }

  async setDataWithTransaction(history:any[]){
    await this.transaction("rw",this.scoreHistory,async()=>{
      await this.scoreHistory.where({storedAt:_currentStore(),isSingle:_isSingle()}).delete();
      this.scoreHistory.bulkPut(history);
    }).catch(e=>{
      console.log(e)
    });
    return;
  }

}

export const songsDB = class extends storageWrapper{
  songs: Dexie.Table<any, any>;

  getDBInfo = async ()=>{
    const db = await this.open();
    return db;
  }

  constructor(){
    super();
    this.songs = this.table("songs");
  }

  async getAll(isSingle:number = 1,willCollection:boolean = false):Promise<any>{
    try{
      const data = isSingle === 1 ?
        this.songs.where("dpLevel").equals("0") :
        this.songs.where("dpLevel").notEqual("0");
      return willCollection ? data : await data.toArray();
    }catch(e:any){
      return [];
    }
  }

  async getSongsNum(level = "12"){
    try{
      return this.getAll(_isSingle()).then(result=>{
        return result.filter((item:songData)=>item.difficultyLevel === level && item.wr !== -1).length;
      })
    }catch(e:any){
      return 1;
    }
  }

  async getAllWithAllPlayModes():Promise<any>{
    try{
      return await this.songs.toCollection().toArray();
    }catch(e:any){
      return [];
    }
  }

  async deleteAll():Promise<void>{
    return await this.songs.clear();
  }

  async getItem(title:string):Promise<any[]>{
    try{
      return await this.songs.where({title:title}).toArray();
    }catch(e:any){
      console.error(e);
      return [];
    }
  }

  async getOneItemIsSingle(title:string,difficulty:string,forcePlayMode:number = -1):Promise<songData[]>{
    const diffs = ():string=>{
      const s = forcePlayMode !== -1 ? forcePlayMode : _isSingle();
      switch(difficulty){
        case "hyper":return s ? "3" : "8";
        case "another":return s ? "4" : "9";
        case "leggendaria":return s ? "10" : "11";
        default:
        return difficulty;
      }
    };
    try{
      return await this.songs.where("[title+difficulty]").equals([title,diffs()]).toArray();
    }catch(e:any){
      return [];
    }
  }

  //統合済み
  async getOneItemIsDouble(title:string,difficulty:string):Promise<songData[]>{
    return this.getOneItemIsSingle(title,difficulty);
  }

  async updateMemo(song:songData,newMemo:string):Promise<boolean>{
    try{
      await this.songs.where({
        title:song.title,
        difficulty:song.difficulty
      }).modify({
        memo:newMemo
      });
      return true;
    }catch(e:any){
      return false;
    }
  }

  async setItem(item:any):Promise<any>{
    try{
      return await this.songs.put({
        title:item["title"],
        difficulty:item["difficulty"],
        wr:Number(item["wr"]),
        avg:Number(item["avg"]),
        notes:Number(item["notes"]),
        bpm:item["bpm"],
        textage:item["textage"],
        difficultyLevel:item["difficultyLevel"],
        dpLevel:item["dpLevel"],
        coef:item["coef"] ? this.validateCoef(Number(item["coef"])) : -1,
        updatedAt: item["updatedAt"] || timeFormatter(0),
      })
    }catch(e:any){
      console.error(e);
      return 1;
    }
  }

  validateCoef = (coef = -1):number=>{
    return coef;
  }

  async updateItem(item:any):Promise<any>{
    try{
      return await this.songs.where({
        "title":item["title"],"difficulty":item["difficulty"]
      }).modify({
        notes:Number(item["notes"]),
        wr:Number(item["wr"]),
        avg:Number(item["avg"]),
        difficulty:item["difficulty"],
        difficultyLevel:item["difficultyLevel"],
        coef:Number(this.validateCoef(item["coef"] || -1)),
        updatedAt: timeFormatter(0),
      })
    }catch(e:any){
      console.error(e);
      return 1;
    }
  }

  async diffChange(title:string,difficulty:string,newDifficultyLevel:string):Promise<any>{
    try{
      await this.songs.where("[title+difficulty]").equals([title,difficulty]).modify({
        difficultyLevel: newDifficultyLevel
      });
      const difficultyStr = difficultyDiscriminator(difficulty);
      const s = _isSingle();
      // Compound Index 検討
      await this.rivals.where({title:title,difficulty:difficultyStr,isSingle:s}).modify({
        difficultyLevel: newDifficultyLevel
      })
      await this.scoreHistory.where({title:title,difficulty:difficultyStr,isSingle:s}).modify({
        difficultyLevel: newDifficultyLevel
      })
      await this.scores.where({title:title,difficulty:difficultyStr,isSingle:s}).modify({
        difficultyLevel: newDifficultyLevel
      })
      return 0;
    }catch(e:any){
      console.error(e);
      return 1;
    }
  }

  async removeItemByDifficulty(title:string,diff:string):Promise<number>{
    return await this.songs.where({title:title,difficultyLevel:diff}).delete();
  }

  async _removeItemByDifficulty(title:string,diff:string):Promise<number>{
    return await this.songs.where({title:title,difficulty:diff}).delete();
  }

  async removeItem(title:string):Promise<number>{
    try{
      return await this.songs.where({title:title}).delete();
    }catch(e:any){
      console.error(e);
      return 1;
    }
  }

  async bulkAdd(obj:any[]):Promise<any>{
    return await this.transaction('rw', this.songs , async () => {
      return Promise.all(obj.map((item:any)=>this.setItem(item)));
    }).catch((e)=>{
      console.log(e);
      return null;
    });
  }

}

export const rivalListsDB = class extends storageWrapper{

  async getAll():Promise<DBRivalStoreData[]>{
    try{
      return this.rivalLists.where("[isSingle+storedAt]").equals([_isSingle(),_currentStore()]).toArray();
    }catch(e:any){
      return [];
    }
  }

  async getRivalLength():Promise<number>{
    try{
      return (await this.rivalLists.where("[isSingle+storedAt]").equals([_isSingle(),_currentStore()]).toArray()).length;
    }catch(e:any){
      return 0;
    }
  }

  async getAllUserScores():Promise<rivalScoreData[]>{
    try{
      return this.rivals.where({isSingle:_isSingle(),storedAt:_currentStore()}).toArray();
    }catch(e:any){
      return [];
    }
  }

  async getAllScores(uid:string):Promise<rivalScoreData[]>{
    try{
      return this.rivals.where({rivalName:uid,isSingle:_isSingle(),storedAt:_currentStore()}).toArray();
    }catch(e:any){
      return [];
    }
  }

  async getAllScoresWithTitle(title:string,difficulty:string):Promise<rivalScoreData[]>{
    try{
      return this.rivals.where({isSingle:_isSingle(),storedAt:_currentStore(),title:title,difficulty:difficulty}).toArray();
    }catch(e:any){
      return [];
    }
  }

  async getAllRivalUid(){
    return (await this.getAll()).reduce(
      (groups:string[],item:DBRivalStoreData)=>{
        groups.push(item.uid);
        return groups;
      },[]
    );
  }

  async getDisplayData(uid:string):Promise<{name:string,icon:string}>{
    try{
      const t = await this.rivalLists.where({uid:uid}).toArray();
      if(t.length > 0){
        return {name:t[0]["rivalName"],icon:t[0]["photoURL"]};
      }else{
        return {name:"UNKNOWN",icon:noimg};
      }
    }catch(e:any){
      return {name:"UNKNOWN",icon:noimg};
    }
  }

  async addUser(meta:any,body:any[]):Promise<any>{
    return await this.transaction('rw', this.rivals, this.rivalLists , async () => {
      this.rivalLists.put(meta);
      return Promise.all(body.map(item => this.rivals.put({
          rivalName:meta.uid,
          title:item.title,
          difficulty:item.difficulty,
          difficultyLevel:item.difficultyLevel,
          exScore:item.exScore,
          missCount:item.missCount,
          clearState:item.clearState,
          storedAt:item.storedAt,
          isSingle:item.isSingle,
          updatedAt:item.updatedAt
        })));
    }).catch((e)=>{
      console.log(e);
      return null;
    });
  }

  async removeUser(meta:any):Promise<any>{
    return await this.transaction('rw', this.rivals, this.rivalLists , async () => {
      this.rivalLists.delete(meta.uid);
      return Promise.all((await (this.rivals.where("rivalName").equals(meta.uid).toArray())).map(item => this.rivals.delete([
          item.title,
          item.difficulty,
          item.storedAt,
          item.isSingle,
          item.rivalName
        ])));
    }).catch((e)=>{
      console.log(e);
      return null;
    });
  }

  async deleteAll(){
    return await this.transaction('rw', this.rivals, this.rivalLists , async () => {
      this.rivalLists.clear();
      this.rivals.clear();
    });
  }

}

export const importer = class extends storageWrapper{

  private historyArray:any = [];
  private scoresArray:scoreData[] = [];
  private shDB = new scoreHistoryDB();
  private sDB = new scoresDB();

  setHistory = (input:any):this=>{
    this.historyArray = input;
    return this;
  }
  setScores = (input:any):this=>{
    this.scoresArray = input;
    return this;
  }

  async exec():Promise<any>{
    const len = this.scoresArray.length;
    if(len > 80){
      for(let i = 0;i < len; ++i){
        const currentScore = this.scoresArray[i];
        const currentHist = this.scoresArray[i];
        currentScore.willModified ? await this.sDB.setItem(currentScore) : await this.sDB.putItem(currentScore);
        this.shDB._add(currentHist,true);
      }
      return;
    }

    return await this.transaction('rw', this.scores, this.scoreHistory , async () => {

      this.historyArray.map((item:any)=>{
        return this.shDB._add(item,true);
      })
      return Promise.all(
      [
        this.scoresArray.map((item) =>{
          return item.willModified ? this.sDB.setItem(item) : this.sDB.putItem(item);
        }),
      ]);

    }).catch((e)=>{
      console.log(e);
      return null;
    });
  }

}

export default storageWrapper;
