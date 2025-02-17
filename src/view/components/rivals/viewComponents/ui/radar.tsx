import React from "react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { _chartColor } from "@/components/settings";
import { radarData } from "@/components/stats/radar";
import { rivalBgColor } from "@/components/common";

class RadarBox extends React.Component<{
  radar:radarData[],
  outerRadius?:number,
  withoutLegend?:boolean
},{}>{

  render(){
    const {radar,outerRadius,withoutLegend} = this.props;
    const chartColor = _chartColor();
    return (
    <div style={{width:"100%",height:"100%"}} className="rivalChart">
      <ResponsiveContainer>
        <RadarChart outerRadius={outerRadius || 110} data={radar}>
          {!withoutLegend && <PolarGrid />}
          <PolarAngleAxis tick={{ fontSize: 10 }} dataKey="title" stroke={chartColor} />
          {!withoutLegend && <PolarRadiusAxis />}
          <Radar name="You" isAnimationActive={false} dataKey="TotalBPI" stroke={rivalBgColor(3)} fill={rivalBgColor(3)} fillOpacity={0.6} />
          <Radar name="Rival" isAnimationActive={false} dataKey="rivalTotalBPI" stroke={rivalBgColor(0)} fill={rivalBgColor(0)} fillOpacity={0.6} />
          <Legend iconSize={5}/>
        </RadarChart>
      </ResponsiveContainer>
    </div>
    );
  }
}

export default RadarBox;
