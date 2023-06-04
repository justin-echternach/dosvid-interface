import type { LoaderArgs } from "@remix-run/node"; // or cloudflare/deno
import { json } from "@remix-run/node"; // or cloudflare/deno
import escapeHtml from "escape-html";

export async function loader({ request }: LoaderArgs) {
    const apiUrl = "http://127.0.0.1:4000/helloworld";
    const res = await fetch(apiUrl);
    // const res = await fetch(apiUrl, {
    //     headers: {
    //         Authorization: `Bearer ${process.env.API_TOKEN}`,
    //     },
    // });

    const data = await res;

    // const prunedSData = data.map((record) => {
    //     return {
    //         id: record.id,
    //         title: record.title,
    //         formattedBody: escapeHtml(record.content),
    //     };
    // });
    //return json({ data });
    return data;
}
