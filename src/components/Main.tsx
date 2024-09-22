import React, { useEffect } from "react";
import { fetchWikiPage } from "./fetch";
function Main() {
  useEffect(() => {
    fetchWikiPage("Random_forest");
  });
  return <div className="bg-blue-100 w-20 h-20">hi</div>;
}

export default Main;
