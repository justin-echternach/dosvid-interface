import { ActionFunction, redirect } from "@remix-run/node";

import type {
    ActionArgs,
    UploadHandler,
} from "@remix-run/node";

import { json } from "@remix-run/node";

import axios from 'axios';

import {
    unstable_composeUploadHandlers,
    unstable_createMemoryUploadHandler,
    unstable_createFileUploadHandler,
    unstable_parseMultipartFormData,
} from "@remix-run/node";

import { writeAsyncIterableToWritable } from "@remix-run/node";

import fs from 'fs/promises';
import { Form, useActionData } from "@remix-run/react";

export const fileUploadHandler = unstable_createFileUploadHandler({
    directory: './public/uploads',
    maxPartSize: 5_000_000_000,
    file: ({ filename }) => filename,
});

type AnswerData = {
    question: string;
    answer: string;
};

type ActionData = {
    transcript: null | string,
    answers: null | AnswerData[]
} | undefined;

export const action = async ({ request }: ActionArgs) => {
    // const uploadHandler = unstable_composeUploadHandlers(
    //     unstable_createFileUploadHandler({
    //         maxPartSize: 5_000_000,
    //         file: ({ filename }) => filename,
    //     }),
    //     // parse everything else into memory
    //     unstable_createMemoryUploadHandler()
    // );

    const memoryUploadHandler = unstable_createMemoryUploadHandler();
    // Compose them
    const uploadHandler = unstable_composeUploadHandlers(
        fileUploadHandler,
        memoryUploadHandler
    );
    const uploadFormData = await unstable_parseMultipartFormData(
        request,
        uploadHandler
    );

    const file = uploadFormData.get("file");
    const generateTranscript = uploadFormData.getAll("transcript")[0];
    const includeSpeakers = uploadFormData.getAll("withSpeakers")[0];
    const questions = uploadFormData.getAll("questions");

    console.log("file", file); // will return the filename
    console.log("generateTranscript:", generateTranscript);
    console.log("includeSpeakers:", includeSpeakers);
    console.log("questions:", questions);

    // ------------------------------------------------------------

    if (!file) {
        return json({ message: 'No file uploaded' }, { status: 400 });
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('transcript', generateTranscript);  // true or false depending on whether a transcript is wanted
    formData.append('withSpeakers', includeSpeakers); // true or false depending on whether speakers are wanted
    formData.append('questions', JSON.stringify(questions)); // array of questions
    for (var pair of formData.entries()) {
        console.log(pair[0] + ', ' + pair[1]);
    }

    try {
        //const response = await axios.post('http://127.0.0.1:4000/analyzeVideo', formData);
        const response = await axios.post('http://dosvidappserver.hcbhdsdyhscvdgh2.eastus.azurecontainer.io/analyzeVideo', formData);

        const { transcript, answers } = response.data;  // retrieve the transcript and the answers from the response
        console.log(transcript, answers);
        return json<ActionData>({
            transcript,
            answers
        });
        //return redirect('/success'); // Redirect to a success page, or wherever you want
    } catch (error) {
        console.error(`Error uploading file: ${error.message}`);
        return redirect('/error'); // Redirect to an error page
    }

    // file is a "NodeOnDiskFile" which implements the "File" API
    // ... etc
};

export default function NewVideoPage() {
    const actionData = useActionData<ActionData>();

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            maxWidth: "500px",
            margin: "0 auto",
        }}>
            <Form
                method="post"
                enctype="multipart/form-data"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    width: "100%",
                }}
            >
                <label>
                    Choose file to upload:
                    <input type="file" name="file" />
                </label>
                <label>
                    Generate transcript?
                    <select name="transcript">
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </select>
                </label>
                <label>
                    Include speakers in transcript?
                    <select name="withSpeakers">
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </select>
                </label>
                <label>
                    Question 1:
                    <input type="text" defaultValue="What are the key insights?" name="questions" />
                </label>
                <label>
                    Question 2:
                    <input type="text" defaultValue="What would be a good plan of action?" name="questions" />
                </label>
                <label>
                    Question 3:
                    <input type="text" defaultValue="What are the industries affected?" name="questions" />
                </label>
                <button
                    type="submit"
                    style={{
                        backgroundColor: "#4CAF50",
                        color: "white",
                        padding: "8px 16px",
                        border: "none",
                        cursor: "pointer",
                    }}
                >
                    Analyze Video
                </button>
            </Form>
            <div>
                {actionData?.transcript}
                {actionData?.answers?.map((data, index) => (
                    <div key={index} style={{ backgroundColor: "#F9F9F9", padding: "16px" }}>
                        <h3 style={{ color: "#4CAF50" }}>{data.question}</h3>
                        <p>{data.answer}</p>
                    </div>
                ))}
            </div>
        </div>

    );
}