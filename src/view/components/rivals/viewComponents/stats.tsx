import * as React from 'react';

import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { getRadar, Details, radarData, withRivalData } from '@/components/stats/radar';
import { _isSingle } from '@/components/settings';
import Grid from '@mui/material/Grid';
import {Link as RefLink, Table, TableBody, TableRow, TableCell, TableHead, Divider} from '@mui/material/';
import Loader from '@/view/components/common/loader';
import { rivalScoreData } from '@/types/data';
import Radar from "./ui/radar";
import { rivalBgColor } from '@/components/common';

interface S {
  scoresAbout:number[],
  scoresByLevel11:number[],
  scoresByLevel12:number[],
  clearAbout:number[],
  clearByLevel11:number[],
  clearByLevel12:number[],
  sum:number,
  sum11:number,
  sum12:number,
  percentage:boolean,
  radar:radarData[],
  isLoading:boolean,
  radarDetail:string
}

interface P {
  full:withRivalData[],
  rivalRawData:rivalScoreData[],
}

class RivalStats extends React.Component<P,S> {

  constructor(props:P){
    super(props);
    this.state = {
      isLoading:true,
      scoresAbout:[],
      scoresByLevel11:[0,0,0],
      scoresByLevel12:[0,0,0],
      clearAbout:[],
      clearByLevel11:[0,0,0],
      clearByLevel12:[0,0,0],
      sum:0,
      sum11:0,
      sum12:0,
      percentage:true,
      radar:[],
      radarDetail:""
    }
  }

  async componentDidMount(){
    const {full} = this.props;
    const scoresAbout = [0,0,0],scoresByLevel11 = [0,0,0],scoresByLevel12 = [0,0,0];
    const clearAbout = [0,0,0],clearByLevel11 = [0,0,0],clearByLevel12 = [0,0,0];
    let sum11 = 0, sum12 = 0;
    for(let i = 0;i < full.length; ++i){
      const indv = full[i];

      //win:0,draw:1,lose:2
      const ex = indv.myEx > indv.rivalEx ? 0 : indv.myEx === indv.rivalEx ? 1 : 2;
      /* ClearState === 7 の場合、 NOPLAY すべてのランプに劣後するため処理上 -999 として取り扱う */
      const myClear = indv.myClearState === 7 ? -999 : indv.myClearState;
      const rivalClear = indv.rivalClearState === 7 ? -999 : indv.rivalClearState;
      const clear = myClear > rivalClear ? 0 : myClear === rivalClear ? 1 : 2;

      scoresAbout[ex]++;
      clearAbout[clear]++;

      if(indv.difficultyLevel === "11"){
        scoresByLevel11[ex]++;
        clearByLevel11[clear]++;
        sum11++;
      }
      if(indv.difficultyLevel === "12"){
        scoresByLevel12[ex]++;
        clearByLevel12[clear]++;
        sum12++;
      }

    }
    return this.setState({
      scoresAbout:scoresAbout,
      scoresByLevel11:scoresByLevel11,
      scoresByLevel12:scoresByLevel12,
      clearAbout:clearAbout,
      clearByLevel11:clearByLevel11,
      clearByLevel12:clearByLevel12,
      sum:full.length,
      sum11:sum11,
      sum12:sum12,
      radar:await getRadar(full),
      isLoading:false,
    })
  }

  toggleRadarDetail = (title:string = "")=> this.setState({radarDetail:title});

  render(){
    const {radar,isLoading,scoresAbout,scoresByLevel11,scoresByLevel12,clearAbout,clearByLevel11,clearByLevel12,sum,sum11,sum12,percentage,radarDetail} = this.state;
    if(isLoading){
      return (<Loader/>);
    }
    return (
      <div>
        <FormControlLabel
          style={{float:"right"}}
          control={
          <Switch
            checked={percentage}
            onChange={(e:React.ChangeEvent<HTMLInputElement>,)=>{
              if(typeof e.target.checked === "boolean"){
                this.setState({percentage:e.target.checked});
              }
            }}
          />
          }
          label="パーセント表示"
        />
        <div className="clearBoth"/>
        <Typography component="h5" variant="h5" color="textPrimary" gutterBottom>
          スコア勝敗
        </Typography>
        <Typography component="h6" variant="h6" color="textPrimary" gutterBottom>
          全体
        </Typography>
        <Graph sum={sum} content={scoresAbout} p={percentage}/>
        <Typography component="h6" variant="h6" color="textPrimary" gutterBottom>
          ☆11
        </Typography>
        <Graph sum={sum11} content={scoresByLevel11} p={percentage}/>
        <Typography component="h6" variant="h6" color="textPrimary" gutterBottom>
          ☆12
        </Typography>
        <Graph sum={sum12} content={scoresByLevel12} p={percentage}/>
        <Divider style={{margin:"15px 0"}}/>
        <Typography component="h5" variant="h5" color="textPrimary" gutterBottom>
          クリア勝敗
        </Typography>
        <Typography component="h6" variant="h6" color="textPrimary" gutterBottom>
          全体
        </Typography>
        <Graph sum={sum} content={clearAbout} p={percentage}/>
        <Typography component="h6" variant="h6" color="textPrimary" gutterBottom>
          ☆11
        </Typography>
        <Graph sum={sum11} content={clearByLevel11} p={percentage}/>
        <Typography component="h6" variant="h6" color="textPrimary" gutterBottom>
          ☆12
        </Typography>
        <Graph sum={sum12} content={clearByLevel12} p={percentage}/>
        <Divider style={{margin:"15px 0"}}/>
        {(_isSingle() === 1 && radar && radar.length > 0) &&
          <Grid container spacing={3}>
            <Grid item xs={12} md={12} lg={12}>
              <Typography component="h6" variant="h6" color="textPrimary" gutterBottom>
                RADAR(<RefLink color="secondary" target="_blank" rel="noopener noreferrer" href="https://docs2.poyashi.me/docs/manage/stats/#レーダー">?</RefLink>)
              </Typography>
              <Grid container spacing={0}>
                <Grid item xs={12} md={12} lg={6} style={{height:"350px"}}>
                  <Radar radar={radar}/>
                </Grid>
                <Grid item xs={12} md={12} lg={6}>
                  <Table size="small" style={{minHeight:"350px"}}>
                    <TableHead>
                      <TableRow className="detailModalTableRow">
                        <TableCell component="th">
                          傾向
                        </TableCell>
                        <TableCell align="right">ライバル</TableCell>
                        <TableCell align="right">あなた</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {radar.concat().sort((a,b)=>b.rivalTotalBPI - a.rivalTotalBPI).map(row => (
                        <TableRow key={row.title} onClick={()=>this.toggleRadarDetail(row.title)}>
                          <TableCell component="th">
                            {row.title}
                          </TableCell>
                          <TableCell align="right">{row.rivalTotalBPI.toFixed(2)}</TableCell>
                          <TableCell align="right">{row.TotalBPI.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        }
        {radarDetail !== "" && <Details closeModal={this.toggleRadarDetail} withRival={true} data={radar} title={radarDetail}/>}
      </div>
    );
  }
}

interface P2 {
  content:number[],
  sum:number,
  p:boolean,
}

class Graph extends React.Component<P2,{}>{

  render(){
    const {content,sum,p} = this.props;
    const calc = (m:number)=> Math.round(m / sum * 100);
    return (
      <div style={{width:"100%",height:"30px",background:"#ccc",display:"flex"}}>
        { content[0] !== 0 &&
          <div style={{width:calc(content[0]) + "%",height:"100%",background:rivalBgColor(0),display:calc(content[0]) === 0 ? "none" : "flex",justifyContent:"center",alignItems:"center"}}>
            {p ? calc(content[0]) + "%" : content[0]}
          </div>
        }
        { content[1] !== 0 &&
          <div style={{width:calc(content[1]) + "%",height:"100%",background:rivalBgColor(1),display:calc(content[1]) === 0 ? "none" : "flex",justifyContent:"center",alignItems:"center"}}>
            {p ? calc(content[1]) + "%" : content[1]}
          </div>
        }
        { content[2] !== 0 &&
          <div style={{width:Math.ceil(100 - (calc(content[0]) + calc(content[1]))) + "%",height:"100%",background:rivalBgColor(2),justifyContent:"center",alignItems:"center",display:calc(content[2]) === 0 ? "none" : "flex"}}>
            {p ? calc(content[2]) + "%" : content[2]}
          </div>
        }
      </div>
    )
  }
}

export default RivalStats;
