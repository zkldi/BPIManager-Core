import * as React from 'react';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import fbActions from '@/components/firebase/actions';
import Loader from '../../common/loader';
import List from '@mui/material/List';
import ModalNotes from '../modal';
import Alert from '@mui/lab/Alert/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import { EachMemo } from '../../songs/songNotes';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

interface S {
  notes:any[],
  isLoading:boolean,
  isModalOpen:boolean,
  data:any,
  sort:number
}

interface P{
  backToMainPage:()=>void|null
  name:string,
  uid:string,
}

class NotesView extends React.Component<P,S> {
  private fbA:fbActions = new fbActions();

  constructor(props:P){
    super(props);
    this.state = {
      isLoading:true,
      isModalOpen:false,
      notes:[],
      data:null,
      sort:0
    }
  }

  async componentDidMount(){
    this.changeSort();
  }

  async changeSort(newSort = 0){
    const {uid} = this.props;
    this.setState({isLoading:true});
    const sort = newSort;
    const loaded = sort === 0 ? await this.fbA.loadUserNotes(uid) : await this.fbA.loadUserNotes(uid,1);
    this.setState({
      notes:loaded.docs,
      isLoading:false,
    })
  }

  onClick = (data:any)=>{
    this.setState({
      isModalOpen:true,
      data:data
    })
  }

  handleModalOpen = (flag:boolean)=> this.setState({isModalOpen:flag,data:null})

  render(){
    const {backToMainPage,name} = this.props;
    const {isLoading,notes,data,isModalOpen,sort} = this.state;
    const sortDisp = [
      "最近書き込まれた順",
      "いいねが多い順"
    ]
    return (
      <div>
        <Typography component="h5" variant="h5" color="textPrimary" gutterBottom>
          <Button onClick={backToMainPage} style={{minWidth:"auto",padding:"6px 0px"}}><ArrowBackIcon/></Button>
          &nbsp;{name}さんのノート
        </Typography>
        {isLoading && <Loader/>}
        {(!isLoading && notes.length === 0) && (
          <Alert severity="warning">
            <AlertTitle>まだノートがありません</AlertTitle>
            <p>{name}さんはまだノートを投稿していません。</p>
          </Alert>
        )}
        {!isLoading && (
          <div>
            <FormControl fullWidth style={{marginTop:"8px"}}>
              <InputLabel>並び替えを変更</InputLabel>
              <Select fullWidth value={sort} onChange={(e:SelectChangeEvent<number>)=>{
                if(typeof e.target.value !== "number") return;
                this.setState({sort:e.target.value});
                this.changeSort(e.target.value);
                }}
              >
                {[0,1].map(item=><MenuItem value={item} key={item}>{sortDisp[item]}</MenuItem>)}
              </Select>
            </FormControl>
            <List component="nav">
              {notes.map((item:any,i:number)=>{
                return (
                  <EachMemo item={item} listType onClick={this.onClick} key={i}/>
                )
              })}
          </List>
          </div>
        )}
        {(isModalOpen && data) && <ModalNotes derived={data} isOpen={isModalOpen} handleOpen={(flag:boolean)=>this.handleModalOpen(flag)}/>}
      </div>
    );
  }
}

export default NotesView;
