'use client';

import {useEffect,useRef,useState} from 'react';

type Props={
  src:string;
  savedSeconds?:number;
  onTimeUpdate?:(currentTime:number,duration:number)=>void;
  onPause?:(currentTime:number)=>void;
  onEnded?:(duration:number)=>void;
};

const formatTime=(seconds:number)=>{
  const s=Math.max(0,Math.floor(seconds||0));
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
};

export default function VideoPlayer({src,savedSeconds=0,onTimeUpdate,onPause,onEnded}:Props){
  const videoRef=useRef<HTMLVideoElement|null>(null);
  const [playing,setPlaying]=useState(false);
  const [muted,setMuted]=useState(false);
  const [volume,setVolume]=useState(1);
  const [current,setCurrent]=useState(0);
  const [duration,setDuration]=useState(0);
  const [fullscreen,setFullscreen]=useState(false);
  const [downloadMessage,setDownloadMessage]=useState(false);
  const [captureWarning,setCaptureWarning]=useState(false);

  useEffect(()=>{
    const video=videoRef.current;
    if(!video)return;
    const handleLoaded=()=>{
      setDuration(video.duration||0);
      if(savedSeconds>0&&savedSeconds<video.duration-2)video.currentTime=savedSeconds;
    };
    const handlePlay=()=>setPlaying(true);
    const handlePause=()=>setPlaying(false);
    const handleTime=()=>{
      setCurrent(video.currentTime);
      onTimeUpdate?.(video.currentTime,video.duration||0);
    };
    const handleEnd=()=>{setPlaying(false);onEnded?.(video.duration||0)};
    video.addEventListener('loadedmetadata',handleLoaded);
    video.addEventListener('play',handlePlay);
    video.addEventListener('pause',handlePause);
    video.addEventListener('timeupdate',handleTime);
    video.addEventListener('ended',handleEnd);
    return()=>{
      video.removeEventListener('loadedmetadata',handleLoaded);
      video.removeEventListener('play',handlePlay);
      video.removeEventListener('pause',handlePause);
      video.removeEventListener('timeupdate',handleTime);
      video.removeEventListener('ended',handleEnd);
    };
  },[savedSeconds,onTimeUpdate,onEnded]);

  const togglePlay=()=>{
    const video=videoRef.current;
    if(!video)return;
    if(video.paused)video.play().catch(()=>{});
    else video.pause();
  };
  const seek=(value:number)=>{
    const video=videoRef.current;
    if(!video||!Number.isFinite(video.duration))return;
    video.currentTime=value;
    setCurrent(value);
  };
  const changeVolume=(value:number)=>{
    const video=videoRef.current;
    if(!video)return;
    video.volume=value;
    video.muted=value===0;
    setVolume(value);
    setMuted(value===0);
  };
  const toggleMute=()=>{
    const video=videoRef.current;
    if(!video)return;
    video.muted=!video.muted;
    setMuted(video.muted);
    if(!video.muted&&video.volume===0){video.volume=.8;setVolume(.8);}
  };
  useEffect(()=>{
    const handleCaptureKey=(e:KeyboardEvent)=>{
      const key=e.key.toLowerCase();
      if(e.key==='PrintScreen'||(e.metaKey&&e.shiftKey&&key==='3')||(e.metaKey&&e.shiftKey&&key==='4')){
        e.preventDefault();
        setCaptureWarning(true);
        window.setTimeout(()=>setCaptureWarning(false),1800);
      }
    };
    window.addEventListener('keydown',handleCaptureKey);
    return()=>window.removeEventListener('keydown',handleCaptureKey);
  },[]);

  const showDownloadMessage=()=>{
    setDownloadMessage(true);
    window.setTimeout(()=>setDownloadMessage(false),5000);
  };

  const toggleFullscreen=async()=>{
    const wrapper=videoRef.current?.parentElement?.parentElement as HTMLElement|null;
    if(!wrapper)return;
    if(document.fullscreenElement){await document.exitFullscreen().catch(()=>{});setFullscreen(false);}
    else {await wrapper.requestFullscreen?.().catch(()=>{});setFullscreen(true);}
  };

  return <div
    className="customVideoPlayer"
    onContextMenu={e=>e.preventDefault()}
    onDragStart={e=>e.preventDefault()}
  >
    <video
      ref={videoRef}
      src={src}
      preload="metadata"
      playsInline
      controls={false}
      disablePictureInPicture
      controlsList="nodownload noremoteplayback"
      className="customVideo"
      onPause={()=>{if(videoRef.current)onPause?.(videoRef.current.currentTime)}}
    />
    <div className="videoWatermark" aria-hidden="true"><div>PROTECTED CONTENT • MARWAN SWEDAN ACADEMY</div><div className="videoWatermarkUser">{typeof window !== "undefined" ? (document.body.dataset.username || "") : ""}</div></div>
    {captureWarning&&<div className="captureShield" role="status" aria-live="polite">Screenshot / screen capture is disabled here.</div>}
    {downloadMessage&&<div className="downloadNotice" role="status" aria-live="polite">ممنوع الداونلوود يا سكر انا بتاع سكيوريتي مش بتاع كفتة😍</div>}
    <div className="customVideoControls">
      <button type="button" className="videoControlButton" onClick={togglePlay} aria-label={playing?'Pause':'Play'}>{playing?'❚❚':'▶'}</button>
      <button type="button" className="videoControlButton" onClick={toggleMute} aria-label={muted?'Unmute':'Mute'}>{muted?'🔇':'🔊'}</button>
      <input className="videoSeek" type="range" min="0" max={Math.max(duration,0.01)} step="0.1" value={Math.min(current,duration||0)} onChange={e=>seek(Number(e.target.value))} aria-label="Video progress"/>
      <span className="videoTime">{formatTime(current)} / {formatTime(duration)}</span>
      <button type="button" className="videoControlButton videoDownloadButton" onClick={showDownloadMessage} aria-label="Download disabled" title="Download disabled">⇩</button>
      <input className="videoVolume" type="range" min="0" max="1" step="0.05" value={muted?0:volume} onChange={e=>changeVolume(Number(e.target.value))} aria-label="Volume"/>
      <button type="button" className="videoControlButton" onClick={toggleFullscreen} aria-label="Fullscreen">{fullscreen?'⤢':'⛶'}</button>
    </div>
  </div>;
}
