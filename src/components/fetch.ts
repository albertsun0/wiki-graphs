import axios from "axios";

const BASE_URL = "https://en.wikipedia.org/api/rest_v1/page";

type Page = {
    title: string
    description: string
    normalizedTitle: string
    id: string;
    visited: boolean
}
export const fetchRelatedPages = async (title: string): Promise<Page[]> => {
    const response = await axios.get(`${BASE_URL}/related/${title}`);
    const data = response.data
    let Pages: Page[] = [];
    data.pages.forEach((page: any) => {
        Pages.push({
            title: page.title,
            description: page.description,
            normalizedTitle: page.normalizedtitle,
            id: page.title,
            visited: false
        })
    })
    return Pages.splice(0, 10);
}

export const fetchPage = async (title: string): Promise<Page> => {
    const response = await axios.get(`${BASE_URL}/summary/${title}`);
    const data = response.data
    return {
        title: data.titles.canonical,
        description: data.description,
        normalizedTitle: data.title,
        id: data.titles.canonical,
        visited: false
    }
}


/*

    A -> B -> C

    Link is source to target
    source will be < target (lexographically)

    if link already exists, increase value

*/