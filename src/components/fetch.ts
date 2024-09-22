import axios from "axios";

const BASE_URL = "https://en.wikipedia.org/api/rest_v1/page/related/";

type Link = {
    title: string;
    url: string;
}
type WikiPage = {
    title: string;
    description: string;
    url: string;
    links: Link[];
}
export const fetchWikiPage = async (title: string) => {
    const response = await axios.get(`${BASE_URL}${title}`);
    console.log(response.data)
    return response.data;
}