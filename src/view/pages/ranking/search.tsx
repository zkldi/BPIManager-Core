import * as React from 'react';
import Container from '@mui/material/Container';
import { injectIntl } from 'react-intl';
import Typography from '@mui/material/Typography';
import { _currentStore } from '@/components/settings';
import timeFormatter, { _isBetween, isBeforeSpecificDate } from '@/components/common/timeFormatter';
import Loader from '@/view/components/common/loader';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { getAltTwitterIcon } from '@/components/rivals';
import AddIcon from '@mui/icons-material/Add';
import InfiniteScroll from 'react-infinite-scroller';
import WeeklyModal from "./modal";
import { timeDiff } from '@/components/common';
import CreateModal from './crud/create';
import Button from '@mui/material/Button';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import PersonIcon from '@mui/icons-material/Person';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ModalUser from '@/view/components/rivals/modal';
import HelpIcon from '@mui/icons-material/Help';
import Alert from '@mui/material/Alert/Alert';
import AlertTitle from '@mui/material/AlertTitle/AlertTitle';
import Link from '@mui/material/Link';
import {Link as RLink} from "react-router-dom";
import { config } from '@/config';
import { AppBar,Tab,Tabs } from '@mui/material';
import { expandUserData, getRanking } from '@/components/ranking/api';

interface S {
  isLoading:boolean,
  rankingList:any[],
  auth:any,
  isLast:boolean,
  offset:number,
  isOpenRanking:boolean,
  currentRankingId:string,
  isOpenCreateModal:boolean,
  showFinished:boolean,
  dialOpen:boolean,
  isOpenUserPage:boolean,
  currentTab:number,
}

class RankingSearch extends React.Component<{intl:any}&RouteComponentProps,S> {

  constructor(props:{intl:any}&RouteComponentProps){
    super(props);
    this.state ={
      currentTab:0,
      isLoading:true,
      rankingList:[],
      auth:null,
      isLast:false,
      offset:0,
      isOpenRanking:false,
      isOpenCreateModal:false,
      currentRankingId:"",
      showFinished:false,
      dialOpen:false,
      isOpenUserPage:false,
    }
  }

  async componentDidMount(){
    this.next();
  }

  next = async(showFinished:boolean = this.state.showFinished,oldList:any = [],force:boolean = false)=>{
    if(this.state.isLast && !force) return;
    this.setState({isLoading:true});
    const res = await getRanking(showFinished,oldList.length);
    if(res.data.error || res.data.info.length === 0){
      return this.setState({isLast:true,isLoading:false,auth:res.data.auth});
    }
    const list = oldList.concat(await expandUserData(res.data.info));
    return this.setState({
      isLoading:false,
      rankingList:list,
      auth:res.data.auth,
      offset:list.length
    })
  }

  handleOpenRanking = (rankId:string = "")=>{
    this.setState({
      isOpenRanking:!this.state.isOpenRanking,
      currentRankingId:rankId
    })
  }

  handleOpenCreateModal = (isCreating:boolean = false)=>{
    if(isCreating) return;
    this.setState({
      isOpenCreateModal:!this.state.isOpenCreateModal,
    })
  }

  handleChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
    const p = !this.state.showFinished;
    this.setState({
      showFinished:p,
      currentTab:newValue,
      isLast:false,
      offset:0,
      rankingList:[],
    });
    this.next(p,[],true);
  };
  toggleDial = ()=> this.setState({dialOpen:!this.state.dialOpen});

  handleModalOpen = (flag:boolean)=> this.setState({isOpenUserPage:flag});

  render(){
    const {isLoading,rankingList,auth,isLast,isOpenRanking,currentRankingId,isOpenCreateModal,dialOpen,isOpenUserPage} = this.state;
    const actions = [
      { icon:  <AddIcon/>, name: 'ランキングを作成', onClick: ()=>this.handleOpenCreateModal(false)},
      { icon: <PersonIcon />, name: '参加したランキング', onClick: ()=>this.handleModalOpen(true)},
      { icon: <HelpIcon />, name: 'この機能について', onClick: ()=>window.open("https://docs2.poyashi.me/docs/social/ranking/")},
    ];
    return (
      <React.Fragment>
        <AppBar position="static" className="subAppBar">
          <Tabs
            value={this.state.currentTab}
            onChange={this.handleChange}
            indicatorColor="secondary"
            variant="scrollable"
            scrollButtons
            textColor="secondary"
            allowScrollButtonsMobile>
            <Tab label="開催中・開催予定" />
            <Tab label="終了済み" />
          </Tabs>
        </AppBar>
      <Container className="commonLayout">
        {(_currentStore() !== config.latestStore ) && (
          <Alert severity="error" style={{margin:"10px 0"}}>
            <AlertTitle>スコア保存先をご確認ください</AlertTitle>
            <p>
              スコアデータの保存先が最新のアーケード版IIDXバージョンではありません。<br/>
              最新の開催中ランキングが表示されない場合があります。<br/>
              <RLink to="/settings" style={{textDecoration:"none"}}><Link color="secondary" component="span">設定画面からスコアの保存先を変更する</Link></RLink>。
            </p>
          </Alert>
        )}
        <InfiniteScroll
          pageStart={0}
          loadMore={()=>this.next()}
          hasMore={!isLast}
          initialLoad={false}
        >
        <List>
          {rankingList.map((item,i)=><RankListItem key={i} item={item} handleOpenRanking={this.handleOpenRanking}/>)}
        </List>
          {isLoading && <Loader text="読み込んでいます"/>}
          {isLast && (
            <div style={{display:"flex",alignItems:"center",flexDirection:"column"}}>
              <ArrowDropUpIcon/>
              <small style={{color:"#ccc"}}>これで全部です!</small>
            </div>
          )}
          </InfiniteScroll>
          {auth &&
            <Button startIcon={<AddIcon/>} onClick={()=>this.handleOpenCreateModal(false)} fullWidth>ランキングを作成</Button>
          }
          {auth &&
            <SpeedDial
              ariaLabel="menu"
              style={{position:"fixed",bottom:"8%",right:"8%"}}
              icon={<SpeedDialIcon icon={<MenuIcon/>} openIcon={<CloseIcon/>} />}
              onClose={this.toggleDial}
              onOpen={this.toggleDial}
              open={dialOpen}
              direction={"up"}
            >
              {actions.map((action) => (
                <SpeedDialAction
                  key={action.name}
                  icon={action.icon}
                  tooltipTitle={action.name}
                  tooltipOpen
                  onClick={action.onClick}
                />
              ))}
            </SpeedDial>
          }
          {isOpenRanking &&
            <WeeklyModal isOpen={isOpenRanking} rankingId={currentRankingId} handleOpen={this.handleOpenRanking}/>
          }
          {isOpenCreateModal &&
            <CreateModal isOpen={isOpenCreateModal} handleOpen={this.handleOpenCreateModal}/>
          }
          {isOpenUserPage && <ModalUser initialView={5} isOpen={isOpenUserPage} exact currentUserName={auth.uid} handleOpen={(flag:boolean)=>this.handleModalOpen(flag)}/>}
      </Container>
    </React.Fragment>
    );
  }
}

export class RankListItem extends React.Component<{item:any,handleOpenRanking:(key:string)=>void},{}>{

  render(){
    const {item} = this.props;
    const isBetween = _isBetween(new Date().toString(),timeFormatter(0,item.since._seconds * 1000),timeFormatter(0,item.until._seconds * 1000));
    const isBefore = isBeforeSpecificDate(new Date(),item.since._seconds * 1000);
    const period = ()=>{
      if(isBetween) return "(開催中)";
      if(!isBetween && isBefore) return "(開催予定)";
      if(!isBetween && !isBefore) return "";
    }
    return (
      <div>
        <ListItem button alignItems="flex-start" onClick={()=>this.props.handleOpenRanking(item.cid)}>
          <ListItemAvatar>
            <img src={item.authorRef.photoURL ? item.authorRef.photoURL.replace("_normal","") : "noimage"} style={{width:"44px",height:"44px",borderRadius:"100%"}}
              alt={item.authorRef.displayName}
              onError={(e)=>(e.target as HTMLImageElement).src = getAltTwitterIcon(item.authorRef)}/>
          </ListItemAvatar>
          <ListItemText
            primary={(item.rankName || "無題のランキング") + " " + period()}
            secondary={
              <React.Fragment>
                <Typography
                  component="span"
                  variant="body2"
                  color="textPrimary"
                >
                  {item.title}
                </Typography>
                &nbsp;{item.sum + "人が参加中("+timeDiff(item.until._seconds * 1000)+")"}
              </React.Fragment>
            }
          />
        </ListItem>
        <Divider variant="inset" component="li" />
      </div>
    )
  }
}

export default withRouter(injectIntl(RankingSearch));
