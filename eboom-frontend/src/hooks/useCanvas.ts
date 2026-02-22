"use client";

import { useState } from "react";
import API_ROUTES from "../api/urls";
import { useMutationApi } from "../api/useMutation";
import useQueryApi from "../api/useQuery";
import { Canvas } from "../types/common";
import { useDispatch } from "react-redux";
import { updateCanvas } from "../redux/canvasSlice";

const hasWindow = typeof window !== "undefined";

const getStoredToken = (key: string) => {
    if (!hasWindow) {
        return null;
    }

    return window.localStorage.getItem(key);
};

export const useCanvas = () => {
    const [canvas, setCanvas] = useState<number | null>(() =>
        Number(getStoredToken("canvasId"))
    );


    const { data, refetch, isLoading: isQueryLoading } = useQueryApi<{ canvases: Canvas[] }>(
        API_ROUTES.CANVASES_LIST,
        {
            queryKey: ["canvases"],
            hasToken: true,
        }
    );

    const { mutateAsync, isPending } = useMutationApi(API_ROUTES.CANVASES_CREATE, {
        method: "post",
        hasToken: true,
    });

    const dispatch = useDispatch();

    const selectCanvas = (canvasId: number) => {
        console.log("selectCanvas", canvasId);
        setCanvas(canvasId);
        dispatch(updateCanvas(canvasId));
    }

    const createCanvas = async (name: string, description: string, canvasType: string, photoUrl: string, baseCurrencyId: number) => {
        await mutateAsync({
            name,
            description: description || undefined,
            canvasType,
            photoUrl,
            baseCurrencyId,
        }).then((newCanvas) => {
            selectCanvas(newCanvas.id);
        });
    }

    // derive loading without setState in effect
    return {
        canvases: data?.canvases ?? [],
        canvas,
        selectCanvas,
        createCanvas,
        isQueryLoading, 
        isCreating: isPending, 
        refetch
    };
};
