import {greyBoxStyle} from "@pages/popup/Consts/Styles";
import {InformationIcon} from "@pages/popup/svg/InformationIcon";
import * as React from "react";

export function InformationBox({informationText}: { informationText: string }) {
    return <div className={greyBoxStyle}>
        <div className={"mr-2"}><InformationIcon/></div>
        <div>{informationText}</div>
    </div>

}