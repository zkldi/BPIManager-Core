import React from "react";
import Dialog from "@material-ui/core/Dialog";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import CloseIcon from "@material-ui/icons/Close";
import MoreVertIcon from '@material-ui/icons/MoreVert';
import TwitterIcon from '@material-ui/icons/Twitter';
import { scoreData, songData } from "../../../types/data";
import { _prefixFromNum, getSongSuffixForIIDXInfo } from "../../../components/songs/filter";
import Grid from "@material-ui/core/Grid";
import Divider from "@material-ui/core/Divider";
import TextField from "@material-ui/core/TextField";
import { FormattedMessage, injectIntl } from "react-intl";
import Paper from "@material-ui/core/Paper";
import bpiCalcuator, { B } from "../../../components/bpi";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import StarIcon from '@material-ui/icons/Star';
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import {songsDB,scoresDB,scoreHistoryDB} from "../../../components/indexedDB";
import ShowSnackBar from "../snackBar";
import {Tooltip as TooltipMUI, Button, CircularProgress, Tooltip, Fab} from '@material-ui/core';
import BPIChart from "./bpiChart";
import SongDetails from "./songDetails";
import SongDiffs from "./songDiffs";
import { UnregisterCallback } from "history";
import TabPanel from "./common/tabPanel";
import { _currentTheme,isEnableTweetButton } from "../../../components/settings";
import _djRank from "../../../components/common/djRank";

interface P{
  isOpen:boolean,
  song:songData|null,
  score:scoreData|null,
  handleOpen:(flag:boolean,row?:any,willDeleteItems?:any)=>void,
  willDelete?:boolean
}

interface S{
  isError:boolean,
  newScore:number,
  newBPI:number,
  newClearState:number,
  newMissCount:number,
  showCharts:boolean,
  chartData:any[],
  currentTab:number,
  anchorEl:null | HTMLElement,
  favorited:boolean,
  successSnack:boolean,
  errorSnack:boolean,
  errorSnackMessage:string,
  graphLastUpdated:number,
  isSaving:boolean,
  showBody:boolean,
}

class DetailedSongInformation extends React.Component<P & {intl?:any},S> {

  private calc:bpiCalcuator = new bpiCalcuator();
  private unlisten:UnregisterCallback|null = null;

  constructor(props:P & {intl?:any}){
    super(props);
    this.state = {
      isError:false,
      newScore: NaN,
      newBPI:NaN,
      newClearState:-1,
      newMissCount:-1,
      showCharts : true,
      chartData:this.makeGraph().reverse(),
      favorited:props.song ? props.song.isFavorited : false,
      currentTab:0,
      anchorEl:null,
      successSnack:false,
      errorSnack:false,
      errorSnackMessage:"",
      graphLastUpdated:new Date().getTime(),
      isSaving:false,
      showBody:false,
    }
  }

  toggleShowBPI = ():void=>{
    return this.setState({showBody:!this.state.showBody});
  }

  makeGraph = (newScore?:number):any[]=>{
    let data:any[] = [],lastExScore = 0;
    const {song,score} = this.props;
    const dataInserter = (exScore:number,label:string):number=>{
      return data.push({
        "name" : label,
        "EX SCORE" : exScore
      });
    }
    if(!song || !score){ return []; }
    this.calc.setData(song.notes * 2, song.avg, song.wr);
    this.calc.setCoef(song.coef || -1);
    const bpiBasis = [0,10,20,30,40,50,60,70,80,90,100];
    const mybest = newScore ? newScore : score.exScore;
    for(let i = 0;i < bpiBasis.length; ++i){
      const exScoreFromBPI:number = this.calc.calcFromBPI(bpiBasis[i],true);
      if(lastExScore < mybest && mybest <= exScoreFromBPI){
        dataInserter(mybest,"YOU");
        lastExScore = mybest;
      }
      lastExScore = exScoreFromBPI;
      dataInserter(exScoreFromBPI,String(bpiBasis[i]));
    }
    if(lastExScore < mybest){
      dataInserter(mybest,"YOU");
    }
    return data;
  }

  handleScoreInput = async(e:React.FocusEvent<HTMLInputElement>):Promise<void>=>{
    const {song} = this.props;
    if(this.state.isSaving){
      return this.setState({errorSnack:true,errorSnackMessage:"保存中です"});
    }
    if(!song){
      return this.setState({errorSnack:true,errorSnackMessage:"楽曲データが不正です。"});
    }
    const newScore:number = Number(e.target.value);
    const newBPI:B = await this.calc.calc(song.title,song.difficulty,newScore);
    if(newBPI.error){
      return this.setState({errorSnack:true,errorSnackMessage:newBPI.reason});
    }
    return this.setState({
      newScore:newScore,
      newBPI:Math.floor(newBPI.bpi * 100) / 100,
      chartData:this.makeGraph(newScore).reverse(),
      graphLastUpdated:new Date().getTime()
    })
  }

  handleTabChange = (_e:React.ChangeEvent<{}>, newValue:number)=> this.setState({currentTab:newValue});

  toggleMenu = (e?: React.MouseEvent<HTMLButtonElement>)=> this.setState({anchorEl: e ? e.currentTarget : null });

  jumpWeb = (type:number):void =>{
    if(!this.props.song){return;}
    switch(type){
      case 0:
        window.open("http://textage.cc/score/" + this.props.song.textage);
      break;
      case 1:
        window.open("https://www.youtube.com/results?search_query=" + this.props.song.title + "+IIDX");
      break;
      case 2:
        if(this.props.song.difficultyLevel !== "12"){
          const {formatMessage} = this.props.intl;
          this.setState({errorSnack:true,errorSnackMessage:formatMessage({id:"Details.ErrorIIDXInfo"})});
        }else{
          window.open(
            `https://iidx.info/songinfo/?title=${this.props.song.title}${getSongSuffixForIIDXInfo(this.props.song.title,this.props.song.difficulty)}`
          );
        }
      break;
      case 3:
        if(!this.props.score) return;
        const score = this.state.newScore ? this.state.newScore : this.props.score.exScore;
        const bpi = this.state.newBPI ? this.state.newBPI : this.props.score.currentBPI;
        const diff = this.props.score.lastScore !== -1 ? score - this.props.score.lastScore : score;
        const text = encodeURIComponent(`[${diff > 0 ? "+" + diff : diff}] ${this.props.song.title}${_prefixFromNum(this.props.song.difficulty,true)} [EX:${score}(${this.showRank(false)}${this.showRank(true)})][BPI:${bpi}]`);
        window.open(`https://twitter.com/intent/tweet?&hashtags=BPIManager&text=${text}`);
      break;
    }
    return this.toggleMenu();
  }

  toggleFavorited = async():Promise<void>=>{
    try{
      const {favorited} = this.state;
      const {song} = this.props;
      const db = new songsDB();
      if(!song){
        throw new Error();
      }
      await db.toggleFavorite(song.title,song.difficulty,!favorited);
      this.toggleSuccessSnack();
      return this.setState({
        favorited:!favorited
      });
    }catch(e){
      console.log(e);
      return;
    }
  }

  toggleSuccessSnack = ()=>this.setState({successSnack:!this.state.successSnack});
  toggleErrorSnack = ()=>this.setState({errorSnack:!this.state.errorSnack});

  calcRank = ()=> this.props.score ? `${this.calc.rank(!Number.isNaN(this.state.newBPI) ? this.state.newBPI : this.props.score.currentBPI)}` : "-";

  saveAndClose = async()=>{
    try{
      const {newBPI,newScore,newClearState,newMissCount} = this.state;
      const {score,song,willDelete} = this.props;
      if(!song || !score){return;}
      this.setState({isSaving:true});
      const scores = new scoresDB(), scoreHist = new scoreHistoryDB();
      await scores.updateScore(score,{currentBPI:newBPI,exScore:newScore,clearState:newClearState,missCount:newMissCount});
      if(!Number.isNaN(newBPI)) scoreHist.add(Object.assign(score, { difficultyLevel: song.difficultyLevel }), { currentBPI: newBPI, exScore: newScore });
      this.props.handleOpen(true,null,willDelete ? {title:score.title,difficulty:score.difficulty} : null);
    }catch(e){
      return this.setState({errorSnack:true,errorSnackMessage:e});
    }
  }

  showRank = (isBody:boolean):string=>{
    const {song,score} = this.props;
    const {showBody,newScore} = this.state;
    if(!song || !score){return "-";}
    const max:number = song.notes * 2;
    const s:number = !Number.isNaN(newScore) ? newScore : score.exScore;
    return _djRank(showBody,isBody,max,s);

  }

  handleClearState = (e:React.ChangeEvent<{ value: unknown }>)=> this.setState({newClearState:Number(e.target.value) < 0 ? 0 : Number(e.target.value)});
  handleMissCount = (e:React.ChangeEvent<HTMLInputElement>)=> this.setState({newMissCount:Number(e.target.value) < 0 ? 0 : Number(e.target.value)});

  render(){
    const {formatMessage} = this.props.intl;
    const {isOpen,handleOpen,song,score} = this.props;
    const {isSaving,newScore,newBPI,newClearState,newMissCount,showCharts,chartData,currentTab,anchorEl,favorited,successSnack,errorSnack,errorSnackMessage} = this.state;
    if(!song || !score){
      return (null);
    }
    const detectStarIconColor = favorited ? "#ffd700" : "#c3c3c3";
    return (
      <Dialog id="detailedScreen" className={_currentTheme() === "dark" ? "darkDetailedScreen" : "lightDetailedScreen"} fullScreen open={isOpen} onClose={handleOpen} style={{overflowX:"hidden",width:"100%"}}>
        <AppBar>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={()=>handleOpen(false)} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" className="be-ellipsis" style={{flexGrow:1}}>
              {song.title + _prefixFromNum(song.difficulty)}
            </Typography>
            {( !Number.isNaN(newBPI) || !Number.isNaN(newScore) || (newClearState !== -1 && newClearState !== score.clearState) || (newMissCount !== -1 && newMissCount !== score.missCount) ) &&
              <div style={{position:"relative"}}>
                <Button variant="contained" color="secondary" onClick={this.saveAndClose} disabled={isSaving}>
                  <FormattedMessage id="Details.SaveButton"/>
                </Button>
                {isSaving && <CircularProgress size={24} style={{color:"#ccc",position:"absolute",top:"50%",left:"50%",marginTop:-12,marginLeft:-12}} />}
              </div>
            }
          </Toolbar>
        </AppBar>
        <Toolbar/>
        <Paper>
          <Grid container spacing={3}>
            <Grid item xs={4} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",margin:"10px 0"}}>
              <Typography component="h6" variant="h6" color="textSecondary">
                BPI
              </Typography>
              <Typography component="h4" variant="h4" color="textPrimary">
                {(score && Number.isNaN(newBPI) && !Number.isNaN(score.currentBPI)) && score.currentBPI}
                {!Number.isNaN(newBPI) && newBPI}
                {(Number.isNaN(score.currentBPI) && Number.isNaN(newBPI)) && <span>-</span>}
              </Typography>
            </Grid>
            <Grid onClick={this.toggleShowBPI} item xs={4} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",margin:"10px 0",cursor:"pointer"}}>
              <Tooltip title="プラス/マイナス表記の切り替え">
                <div style={{textAlign:"center"}}>
                  <Typography component="h6" variant="h6" color="textSecondary">
                    {score && <span>{this.showRank(false)}</span>}
                  </Typography>
                  <Typography component="h4" variant="h4" color="textPrimary">
                    {score && <span>{this.showRank(true)}</span>}
                  </Typography>
                </div>
              </Tooltip>
            </Grid>
            <Grid item xs={4} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",margin:"10px 0"}}>
              <Typography component="h6" variant="h6" color="textSecondary">
                RANK
              </Typography>
              <Typography component="h4" variant="h4" color="textPrimary">
                {(!Number.isNaN(score.currentBPI) || !Number.isNaN(newBPI)) && <span>{this.calcRank()}</span>}
                {(Number.isNaN(score.currentBPI) && Number.isNaN(newBPI)) && <span>-</span>}
              </Typography>
            </Grid>
          </Grid>
          <Divider/>
          <Grid container>
            <Grid item xs={8}>
              <form noValidate autoComplete="off" style={{margin:"10px 6px 0"}}>
                <TextField
                  type="number"
                  style={{width:"100%"}}
                  label={<FormattedMessage id="Details.typeNewScore"/>}
                  value={!Number.isNaN(newScore) ? newScore : score ? score.exScore : 0}
                  onChange={this.handleScoreInput}
                />
              </form>
            </Grid>
            <Grid item xs={1} style={{display:"flex",alignItems:"center",justifyContent:"flex-end"}}>
              <div style={{margin:"10px 6px 0"}}>
                <TooltipMUI title={<FormattedMessage id={favorited ? "Details.FavButtonRemove" : "Details.FavButton"}/>} aria-label="add">
                  <StarIcon style={{fontSize:"35px",color:detectStarIconColor,position:"relative",top:"3px"}}
                    onClick={this.toggleFavorited}/>
                </TooltipMUI>
              </div>
              <ShowSnackBar
                message={
                  favorited ? formatMessage({id:"Details.FavButtonAdded"}) : formatMessage({id:"Details.FavButtonRemoved"})}
                variant="success" handleClose={this.toggleSuccessSnack} open={successSnack} autoHideDuration={1000}/>
            </Grid>
            <Grid item xs={1} style={{display:"flex",alignItems:"center",justifyContent:"flex-end"}}>
              <IconButton style={{margin:"10px 6px 0"}}
                aria-haspopup="true"
                onClick={this.toggleMenu}>
                  <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={()=>this.toggleMenu()}
                >
                  <MenuItem onClick={()=>this.jumpWeb(0)}>TexTage</MenuItem>
                  <MenuItem onClick={()=>this.jumpWeb(1)}>YouTube</MenuItem>
                  <MenuItem onClick={()=>this.jumpWeb(2)}>IIDX.info</MenuItem>
                </Menu>
            </Grid>
          </Grid>
        </Paper>
        <Tabs
          value={currentTab}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          onChange={this.handleTabChange}>
          <Tab label={<FormattedMessage id="Details.Graph"/>} />
          <Tab label={<FormattedMessage id="Details.Details"/>} />
          <Tab label={<FormattedMessage id="Details.Diffs"/>} />
        </Tabs>
        <TabPanel value={currentTab} index={0}>
          {showCharts &&
            <BPIChart song={song} newScore={newScore} score={score} chartData={chartData} graphLastUpdated={this.state.graphLastUpdated}/>
          }
          {isEnableTweetButton() &&
            <Fab style={{position:"absolute","right":"20px","bottom":"50px",backgroundColor:"#55acee",color:"#fff"}} onClick={()=>this.jumpWeb(3)} aria-label="tweet">
              <TwitterIcon />
            </Fab>
          }
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <SongDetails song={song} score={score} newMissCount={newMissCount} newClearState={newClearState}
            handleClearState={this.handleClearState} handleMissCount={this.handleMissCount}/>
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <SongDiffs song={song} score={score}/>
        </TabPanel>
        <ShowSnackBar message={errorSnackMessage} variant="warning"
            handleClose={this.toggleErrorSnack} open={errorSnack} autoHideDuration={3000}/>
      </Dialog>
    );
  }
}

export default injectIntl(DetailedSongInformation);
