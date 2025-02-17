import React, { useEffect } from "react";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
declare global {
    interface Window {
        adsbygoogle: any,
    }
}

export default function AdsCard() {
    useEffect(() => {
      if(window.location.href.match("localhost")){
        return;
      }
        if (window.adsbygoogle && process.env.NODE_ENV !== "development") {
            window.adsbygoogle.push({});
        }
    }, [])
    if(window.location.href.match("localhost")){
      return (null);
    }

    return (
      <div style={{margin:"8px auto"}}>
        <Divider />
        <li style={{listStyleType:"none"}}>
          <Typography
            style={{padding:"4px 8px"}}
            color="textSecondary"
            display="block"
            variant="caption"
          >
            Ads by Google
          </Typography>
        </li>
        <ins className="adsbygoogle"
          style={{display:"flex",margin:"5px auto",justifyContent:"center"}}
          data-ad-client="ca-pub-9237861069664679"
          data-ad-slot="5844744770"
          data-ad-format="auto"
          data-full-width-responsive="true"></ins>
      </div>
    );
}
