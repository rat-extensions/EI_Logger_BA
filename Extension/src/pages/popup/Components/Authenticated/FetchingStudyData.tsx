import React, {useEffect, useState} from "react";
import {getStudy} from "@pages/popup/ServerAPI";
import {Backdrop, CircularProgress} from "@mui/material";
import {extractAndSetError} from "@pages/popup/UtilityFunctions";
import {ErrorMessage} from "@pages/popup/SharedComponents/ErrorMessage";
import {useNavigate} from "react-router-dom";
import {dataBase} from "@pages/popup/database";
import {
    IMultipleChoiceQuestion,
    IQuestion,
    IRangeQuestion,
    IStudy,
    ITask,
    ITextQuestion
} from "@pages/popup/Interfaces";
import {Study} from "@pages/popup/model/Study";
import {Task} from "@pages/popup/model/Task";
import Paths from "@pages/popup/Consts/Paths";
import {fgLoggingConstants} from "@pages/popup/Consts/FgLoggingConstants";

export function FetchingStudyData() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [retryFlag, setRetryFlag] = useState<boolean>(false);
    const navigate = useNavigate();


    useEffect(function fetchStudy() {
        setLoading(true);

        getStudy()
            .then(saveStudyAndNavigate)
            .catch(error => extractAndSetError(error, setError))
            .finally(() => setLoading(false));

        async function saveStudyAndNavigate(study: Study) {
            await saveStudy(study)

            const hasTasks = study.tasks.length > 0;
            const hasDemographics = await dataBase.getHasDemographics();
            await transitionToNextPage(hasDemographics, hasTasks);

            async function saveStudy(study: Study) {
                await saveStudyInDatabase(new Study(study.studyId, study.name, study.hasDemographics, study.tasks));
                fgLoggingConstants.studyId = study.studyId;

                async function saveStudyInDatabase(studyData: Study) {
                    const {
                        study,
                        tasks,
                        multipleChoiceQuestions,
                        textQuestions,
                        rangeQuestions
                    } = extractStudyData(studyData);

                    await dataBase.saveStudyInfo(study, tasks, multipleChoiceQuestions, textQuestions, rangeQuestions);

                    function extractStudyData(studyData: Study) {
                        const study: IStudy = {
                            studyId: studyData.studyId,
                            name: studyData.name,
                            hasDemographics: studyData.hasDemographics,
                        }

                        const tasks = studyData.tasks.map((task: Task): ITask => ({
                            taskId: task.taskId,
                            text: task.text,
                            isStarted: false,
                            isCompleted: false,
                            isPreQuestionsSubmitted: false,
                            isPostQuestionsSubmitted: false,
                            iPreQuestions: task.getIPreQuestions(),
                            iPostQuestions: task.getIPostQuestions(),
                        }))

                        const questions: IQuestion[] = studyData.getIQuestions();
                        const multipleChoiceQuestions = questions.filter(question => question.type === "MultipleChoiceQuestion") as IMultipleChoiceQuestion[]
                        const textQuestions = questions.filter(question => question.type === "TextQuestion") as ITextQuestion[]
                        const rangeQuestions = questions.filter(question => question.type === "RangeQuestion") as IRangeQuestion[]

                        return {study, tasks, multipleChoiceQuestions, textQuestions, rangeQuestions}
                    }
                }
            }

            async function transitionToNextPage(hasDemographics: boolean, hasTasks: boolean) {
                if (hasDemographics) {
                    await dataBase.setExtensionState('DEMOGRAPHICS');
                    navigate(Paths.demographicsPage)
                } else if (hasTasks) {
                    await dataBase.setExtensionState('TASKS_PAGE');
                    navigate(Paths.tasksPage)
                } else {
                    await dataBase.setExtensionState('LOGGER_READY');
                    navigate(Paths.loggerPage)
                }
            }
        }

    }, [retryFlag]);

    function retry() {
        setRetryFlag(!retryFlag)
    }

    return (
        <>
            <Backdrop
                sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}
                open={loading}
            >
                <CircularProgress color="inherit"/>
            </Backdrop>
            <ErrorMessage error={error}/>
            {error && <button onClick={retry}>Retry</button>}
        </>
    );
}