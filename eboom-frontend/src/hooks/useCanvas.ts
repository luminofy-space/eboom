"use client";

import { useEffect, useState, useCallback } from "react";
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
    const { data, refetch, isLoading: isQueryLoading } = useQueryApi<{ canvases: Canvas[] }>(
        API_ROUTES.CANVASES_LIST,
        {
            queryKey: ["canvases"],
            hasToken: true,
        }
    );

    const [canvas, setCanvas] = useState<number | null>(() =>
        Number(getStoredToken("canvasId")) 
    );

    const { mutateAsync, isPending } = useMutationApi(API_ROUTES.CANVASES_CREATE, {
        method: "post",
        hasToken: true,
    });

    const dispatch = useDispatch();

    const selectCanvas = useCallback((canvasId: number) => {
        setCanvas(canvasId);
        dispatch(updateCanvas(canvasId));
        if (hasWindow) {
            window.localStorage.setItem("canvasId", canvasId.toString());
        }
    }, [dispatch]);

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

    useEffect(() => {
        if (canvas) return;
        const firstId = data?.canvases?.[0]?.id;
        if (typeof firstId === "number") {
            setTimeout(() => selectCanvas(firstId), 0);
        }
    }, [canvas, data?.canvases, selectCanvas]);

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
